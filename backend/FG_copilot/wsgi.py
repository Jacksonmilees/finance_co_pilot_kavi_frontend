"""
WSGI config for FG_copilot project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os
import sys
import logging
from django.core.wsgi import get_wsgi_application

# Configure logging before loading Django
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(asctime)s %(name)s: %(message)s',
    stream=sys.stdout
)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FG_copilot.settings')

# Wrap WSGI application to handle broken pipe errors
def application(environ, start_response):
    """
    WSGI application wrapper that handles broken pipe errors gracefully
    """
    try:
        app = get_wsgi_application()
        return app(environ, start_response)
    except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError) as e:
        # Log broken pipe errors but don't crash
        logger = logging.getLogger('django.request')
        logger.warning(f"Broken pipe error in WSGI: {str(e)}")
        
        # Return a minimal response
        def minimal_start_response(status, headers):
            pass
        
        try:
            start_response('200 OK', [('Content-Type', 'text/plain')])
        except:
            pass
        
        return [b'OK']
    except Exception as e:
        # Log other exceptions
        logger = logging.getLogger('django.request')
        logger.error(f"WSGI error: {str(e)}", exc_info=True)
        raise
