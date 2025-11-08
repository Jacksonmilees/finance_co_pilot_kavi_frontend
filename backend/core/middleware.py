"""
Logging middleware to log all requests, responses, and page elements
Also handles broken pipe errors gracefully
"""
import logging
import sys
import time
import json
import traceback
from django.utils.deprecation import MiddlewareMixin
from django.db import connections

logger = logging.getLogger('django.request')
page_logger = logging.getLogger('page.elements')
db_logger = logging.getLogger('database')


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log all requests, responses, and page elements
    Handles broken pipe errors gracefully
    """
    
    def process_request(self, request):
        """Log incoming request details"""
        request.start_time = time.time()
        
        # Log request details
        request_data = {
            'method': request.method,
            'path': request.path,
            'query_params': dict(request.GET),
            'user': str(request.user) if hasattr(request, 'user') and request.user.is_authenticated else 'Anonymous',
            'ip_address': self.get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'content_type': request.content_type,
        }
        
        # Log request body for POST/PUT/PATCH (limited size)
        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                body = request.body.decode('utf-8')[:1000]  # Limit to 1000 chars
                if body:
                    try:
                        request_data['body'] = json.loads(body)
                    except:
                        request_data['body'] = body[:500]  # Truncate if not JSON
            except:
                pass
        
        logger.info(f"REQUEST: {request.method} {request.path}", extra={'request_data': request_data})
        
        # Log database connections status
        self.log_database_status()
        
        return None
    
    def process_response(self, request, response):
        """Log response details and page elements"""
        duration = time.time() - getattr(request, 'start_time', time.time())
        
        # Log response details
        response_data = {
            'status_code': response.status_code,
            'content_type': response.get('Content-Type', ''),
            'duration': f"{duration:.3f}s",
            'path': request.path,
            'method': request.method,
        }
        
        # Log response content for API responses (limited size)
        if hasattr(response, 'data') and response.data:
            try:
                response_data['response_data'] = str(response.data)[:500]
            except:
                pass
        
        logger.info(f"RESPONSE: {response.status_code} {request.path} ({duration:.3f}s)", 
                   extra={'response_data': response_data})
        
        # Log page elements for HTML responses
        if response.get('Content-Type', '').startswith('text/html'):
            self.log_page_elements(request, response)
        
        # Log database queries executed
        self.log_database_queries(request)
        
        return response
    
    def process_exception(self, request, exception):
        """Handle exceptions including broken pipe errors"""
        exc_type = type(exception).__name__
        
        # Handle broken pipe errors gracefully
        if isinstance(exception, (BrokenPipeError, ConnectionAbortedError, ConnectionResetError)):
            logger.warning(f"Broken pipe error on {request.path}: {exc_type} - {str(exception)}")
            # Don't re-raise broken pipe errors, they're usually harmless
            return None
        
        # Log other exceptions
        logger.error(
            f"EXCEPTION on {request.path}: {exc_type} - {str(exception)}",
            exc_info=True,
            extra={
                'exception_type': exc_type,
                'exception_message': str(exception),
                'traceback': traceback.format_exc(),
                'path': request.path,
                'method': request.method,
            }
        )
        
        return None
    
    def log_page_elements(self, request, response):
        """Log all page elements from the response"""
        try:
            content = response.content.decode('utf-8') if hasattr(response, 'content') else ''
            
            # Extract key page elements
            elements = {
                'title': self.extract_element(content, '<title>', '</title>'),
                'meta_tags': self.extract_meta_tags(content),
                'scripts': self.count_elements(content, '<script'),
                'stylesheets': self.count_elements(content, '<link'),
                'images': self.count_elements(content, '<img'),
                'forms': self.count_elements(content, '<form'),
                'links': self.count_elements(content, '<a href'),
                'divs': self.count_elements(content, '<div'),
                'tables': self.count_elements(content, '<table'),
            }
            
            page_logger.info(
                f"PAGE ELEMENTS: {request.path}",
                extra={
                    'path': request.path,
                    'elements': elements,
                    'content_length': len(content),
                }
            )
        except Exception as e:
            logger.warning(f"Error logging page elements: {str(e)}")
    
    def extract_element(self, content, start_tag, end_tag):
        """Extract element content between tags"""
        try:
            start = content.find(start_tag)
            if start != -1:
                start += len(start_tag)
                end = content.find(end_tag, start)
                if end != -1:
                    return content[start:end].strip()
        except:
            pass
        return None
    
    def extract_meta_tags(self, content):
        """Extract meta tags from content"""
        meta_tags = []
        try:
            import re
            pattern = r'<meta[^>]*>'
            matches = re.findall(pattern, content, re.IGNORECASE)
            meta_tags = matches[:10]  # Limit to 10 meta tags
        except:
            pass
        return meta_tags
    
    def count_elements(self, content, pattern):
        """Count occurrences of an element pattern"""
        try:
            return content.lower().count(pattern.lower())
        except:
            return 0
    
    def log_database_queries(self, request):
        """Log database queries executed during request"""
        try:
            from django.db import connection
            queries = connection.queries
            if queries:
                query_count = len(queries)
                total_time = sum(float(q['time']) for q in queries)
                
                db_logger.info(
                    f"DB QUERIES: {request.path} - {query_count} queries in {total_time:.3f}s",
                    extra={
                        'path': request.path,
                        'query_count': query_count,
                        'total_time': total_time,
                        'queries': queries[-5:] if len(queries) > 5 else queries,  # Log last 5 queries
                    }
                )
        except Exception as e:
            logger.warning(f"Error logging database queries: {str(e)}")
    
    def log_database_status(self):
        """Log database connection status"""
        try:
            # connections.all() returns a list, not a dict
            for conn in connections.all():
                try:
                    conn_name = conn.alias if hasattr(conn, 'alias') else 'default'
                    with conn.cursor() as cursor:
                        cursor.execute("SELECT 1")
                        db_logger.debug(f"DB Connection {conn_name}: OK")
                except Exception as e:
                    conn_name = conn.alias if hasattr(conn, 'alias') else 'default'
                    db_logger.error(f"DB Connection {conn_name}: ERROR - {str(e)}")
        except Exception as e:
            db_logger.warning(f"Error checking database status: {str(e)}")
    
    def get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class BrokenPipeHandlerMiddleware(MiddlewareMixin):
    """
    Middleware specifically to handle broken pipe errors
    """
    
    def process_response(self, request, response):
        """Wrap response to handle broken pipes"""
        try:
            return response
        except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError) as e:
            logger.warning(f"Broken pipe while sending response for {request.path}: {str(e)}")
            # Return a minimal response
            from django.http import HttpResponse
            return HttpResponse(status=200)
    
    def process_exception(self, request, exception):
        """Catch broken pipe exceptions"""
        if isinstance(exception, (BrokenPipeError, ConnectionAbortedError, ConnectionResetError)):
            logger.warning(f"Broken pipe exception on {request.path}: {str(exception)}")
            # Don't propagate broken pipe errors
            from django.http import HttpResponse
            return HttpResponse(status=200)
        return None

