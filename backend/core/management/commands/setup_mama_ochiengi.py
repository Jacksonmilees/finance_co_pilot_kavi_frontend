from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Business, Membership, UserProfile
from core.models import ModuleAssignment

User = get_user_model()

class Command(BaseCommand):
    help = 'Assign Mama Ochiengi to her business and enable all modules'

    def handle(self, *args, **options):
        self.stdout.write('Setting up Mama Ochiengi account...')
        
        try:
            # Get Mama Ochiengi user
            mama_ochiengi = User.objects.get(username='mama_ochiengi')
            self.stdout.write(f'[OK] Found user: {mama_ochiengi.username}')
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('[ERROR] Mama Ochiengi user not found!'))
            return
        
        try:
            # Get or create the business
            mama_business, created = Business.objects.get_or_create(
                legal_name='Mama Ochiengi Fresh Produce Ltd',
                defaults={
                    'owner': mama_ochiengi,
                    'dba_name': 'Mama Ochiengi Fresh Produce',
                    'website': 'https://mamaochiengi-produce.co.ke',
                    'year_founded': 2018,
                    'employee_count': 8,
                    'hq_city': 'Kisumu',
                    'hq_country': 'Kenya',
                    'revenue_band': '500K-1M',
                    'business_model': 'B2C',
                    'sales_motion': 'transactional',
                    'industry_keywords': 'agriculture, fresh produce, trading, retail, food',
                    'registration_number': 'BN-KSM-2018-4521'
                }
            )
            
            if created:
                self.stdout.write(f'[OK] Created business: {mama_business.legal_name}')
            else:
                self.stdout.write(f'[OK] Found existing business: {mama_business.legal_name}')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'[ERROR] Failed to get/create business: {str(e)}'))
            return
        
        # Create or update membership
        try:
            membership, created = Membership.objects.get_or_create(
                business=mama_business,
                user=mama_ochiengi,
                defaults={
                    'role_in_business': 'business_admin',
                    'is_active': True
                }
            )
            
            if not created:
                # Update existing membership
                membership.role_in_business = 'business_admin'
                membership.is_active = True
                membership.save()
                self.stdout.write(f'[OK] Updated membership: {membership}')
            else:
                self.stdout.write(f'[OK] Created membership: {membership}')
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'[ERROR] Failed to create membership: {str(e)}'))
            return
        
        # Ensure user profile is set correctly
        try:
            profile, _ = UserProfile.objects.get_or_create(
                user=mama_ochiengi,
                defaults={
                    'role': 'owner',
                    'phone_number': '+254720123456'
                }
            )
            if not profile.phone_number:
                profile.phone_number = '+254720123456'
            profile.role = 'owner'
            profile.save()
            self.stdout.write(f'[OK] Updated user profile')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'[ERROR] Failed to update profile: {str(e)}'))
        
        # Assign ALL modules
        self.stdout.write('\nAssigning modules...')
        
        modules = [
            ('transactions', 'Transactions'),
            ('invoices', 'Invoices'),
            ('cash-flow', 'Cash Flow'),
            ('credit', 'Credit Management'),
            ('suppliers', 'Suppliers'),
            ('clients', 'Clients'),
            ('reports', 'Reports & Analytics'),
            ('insights', 'AI Insights'),
            ('proactive-alerts', 'Proactive Alerts'),
            ('team', 'Team Management'),
            ('voice-assistant', 'KAVI Voice Assistant'),
            ('settings', 'Settings'),
            ('budgets', 'Budgets'),
            ('dashboard', 'Dashboard'),
        ]
        
        assigned_count = 0
        for module_id, module_name in modules:
            try:
                assignment, created = ModuleAssignment.objects.get_or_create(
                    business=mama_business,
                    module_id=module_id,
                    defaults={
                        'module_name': module_name,
                        'enabled': True,
                        'assigned_by': mama_ochiengi
                    }
                )
                
                if not created:
                    # Enable if it was disabled
                    if not assignment.enabled:
                        assignment.enabled = True
                        assignment.save()
                        self.stdout.write(f'  [OK] Enabled module: {module_name}')
                    else:
                        self.stdout.write(f'  [OK] Module already enabled: {module_name}')
                else:
                    self.stdout.write(f'  [OK] Assigned module: {module_name}')
                
                assigned_count += 1
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  [ERROR] Failed to assign {module_name}: {str(e)}'))
        
        # Print summary
        self.stdout.write('\n' + '='*80)
        self.stdout.write(self.style.SUCCESS('[SUCCESS] Mama Ochiengi Setup Complete!'))
        self.stdout.write('='*80)
        self.stdout.write(f'\nUser: {mama_ochiengi.username} ({mama_ochiengi.email})')
        self.stdout.write(f'Business: {mama_business.legal_name}')
        self.stdout.write(f'Role: {membership.role_in_business}')
        self.stdout.write(f'Modules Assigned: {assigned_count}/{len(modules)}')
        self.stdout.write('\n[INFO] User must LOG OUT and LOG BACK IN for changes to take effect!')
        self.stdout.write('='*80)

