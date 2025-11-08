# backend/users/serializers.py
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Business, UserProfile, Customer, Membership, BusinessInvitation, BusinessRegistration, IndividualRegistration


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_superuser', 'is_staff']


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model"""
    user = UserSerializer(read_only=True)
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'full_name',
            'phone_number', 'date_of_birth', 'bio', 'avatar',
            'job_title', 'company', 'industry', 'experience_years',
            'country', 'city', 'timezone',
            'language', 'currency', 'notification_preferences',
            'risk_tolerance', 'role',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating UserProfile"""
    # Allow updating user fields through profile
    username = serializers.CharField(source='user.username', required=False)
    email = serializers.EmailField(source='user.email', required=False)
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    
    class Meta:
        model = UserProfile
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'phone_number', 'date_of_birth', 'bio', 'avatar',
            'job_title', 'company', 'industry', 'experience_years',
            'country', 'city', 'timezone',
            'language', 'currency', 'notification_preferences',
            'risk_tolerance', 'role'
        ]
    
    def update(self, instance, validated_data):
        # Extract nested user fields coming from source='user.*'
        user_data = validated_data.pop('user', {})
        if user_data:
            for attr, value in user_data.items():
                setattr(instance.user, attr, value)
            instance.user.save()

        # Update profile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class BusinessSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)

    class Meta:
        model = Business
        fields = '__all__'
        read_only_fields = ['owner', 'classified_category', 'classified_confidence', 'classified_tags', 'last_classified_at', 'created_at', 'updated_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name']

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )


class CustomerSerializer(serializers.ModelSerializer):
    """Serializer for Customer model"""
    owner = UserSerializer(read_only=True)
    onboarded_by = UserSerializer(read_only=True)
    outstanding_balance = serializers.ReadOnlyField()
    
    class Meta:
        model = Customer
        fields = [
            'id', 'business', 'owner', 'customer_name', 'email', 'phone_number',
            'customer_type', 'company_name', 'physical_address', 'payment_terms',
            'total_invoiced', 'total_paid', 'outstanding_balance',
            'status', 'onboarded_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'onboarded_by', 'total_invoiced', 'total_paid', 'created_at', 'updated_at']


class CustomerCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Customer"""
    
    class Meta:
        model = Customer
        fields = [
            'customer_name', 'email', 'phone_number', 'customer_type',
            'company_name', 'physical_address', 'payment_terms', 'status'
        ]
        extra_kwargs = {
            'customer_name': {'required': True},
            'email': {'required': True},
            'phone_number': {'required': True},
        }


class MembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    business = BusinessSerializer(read_only=True)

    class Meta:
        model = Membership
        fields = [
            'id', 'business', 'user', 'role_in_business', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'business', 'user', 'created_at', 'updated_at']


class MembershipCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membership
        fields = ['business', 'user', 'role_in_business', 'is_active']
        extra_kwargs = {
            'business': {'required': True},
            'user': {'required': True},
            'role_in_business': {'required': True},
        }


class BusinessInvitationSerializer(serializers.ModelSerializer):
    business = BusinessSerializer(read_only=True)
    invited_by = UserSerializer(read_only=True)
    
    class Meta:
        model = BusinessInvitation
        fields = [
            'id', 'business', 'email', 'role_in_business', 'invited_by',
            'status', 'expires_at', 'accepted_at', 'created_at', 'updated_at', 'token'
        ]
        read_only_fields = ['id', 'business', 'invited_by', 'status', 'accepted_at', 'created_at', 'updated_at']


class BusinessInvitationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessInvitation
        fields = ['business', 'email', 'role_in_business']
        extra_kwargs = {
            'business': {'required': True},
            'email': {'required': True},
            'role_in_business': {'required': True},
        }


class BusinessRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for Business Registration applications"""
    class Meta:
        model = BusinessRegistration
        fields = [
            'id', 'business_name', 'business_type', 'registration_number', 'tax_pin',
            'location', 'monthly_revenue', 'owner_name', 'email', 'phone_number',
            'registration_certificate_url', 'kra_pin_certificate_url', 'id_document_url',
            'status', 'reviewed_by', 'reviewed_at', 'rejection_reason', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at']


class BusinessRegistrationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating business registration"""
    class Meta:
        model = BusinessRegistration
        fields = [
            'business_name', 'business_type', 'registration_number', 'tax_pin',
            'location', 'monthly_revenue', 'owner_name', 'email', 'phone_number',
            'registration_certificate_url', 'kra_pin_certificate_url', 'id_document_url'
        ]


class IndividualRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for Individual Registration applications"""
    preferred_business_name = serializers.CharField(source='preferred_business.legal_name', read_only=True)
    assigned_business_name = serializers.CharField(source='assigned_business.legal_name', read_only=True)
    
    class Meta:
        model = IndividualRegistration
        fields = [
            'id', 'full_name', 'email', 'phone_number', 'id_number', 'date_of_birth',
            'country', 'city', 'preferred_business', 'preferred_business_name',
            'id_document_url', 'status', 'reviewed_by', 'reviewed_at', 
            'rejection_reason', 'notes', 'assigned_business', 'assigned_business_name',
            'assigned_role', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at']


class IndividualRegistrationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating individual registration"""
    class Meta:
        model = IndividualRegistration
        fields = [
            'full_name', 'email', 'phone_number', 'id_number', 'date_of_birth',
            'country', 'city', 'preferred_business', 'id_document_url'
        ]
        extra_kwargs = {
            'full_name': {'required': True},
            'email': {'required': True},
            'phone_number': {'required': True},
            'id_number': {'required': True},
            'city': {'required': True},
            'date_of_birth': {'required': False, 'allow_null': True},
            'country': {'required': False},
            'preferred_business': {'required': False, 'allow_null': True},
            'id_document_url': {'required': False, 'allow_blank': True},
        }