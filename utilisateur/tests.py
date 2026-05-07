from django.test import TestCase
from rest_framework.test import APITestCase
from utilisateur.models import User


class AuthEndpointsTest(APITestCase):
    def setUp(self):
        self.registration_url = '/api/v1/auth/registration/'
        self.login_url = '/api/v1/auth/login/'
        self.me_url = '/api/v1/auth/me/'
        self.logout_url = '/api/v1/auth/logout/'
        self.apply_prestataire_url = '/api/v1/auth/prestataire/apply/'
        self.password = 'TestPass123!'

        self.user = User.objects.create_user(
            username='copilot_testuser',
            email='testuser+copilot@example.com',
            password=self.password,
        )

    def authenticate(self, payload):
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, 200, response.content.decode())
        return response.data['access']

    def test_registration_requires_username(self):
        payload = {
            'email': 'newuser+copilot@example.com',
            'telephone': '+2250700000002',
            'password1': self.password,
            'password2': self.password,
            'first_name': 'Test',
            'last_name': 'User'
        }
        response = self.client.post(self.registration_url, payload, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('username', response.data)

    def test_registration_creates_user_and_returns_tokens(self):
        payload = {
            'username': 'copilot_newuser',
            'email': 'newuser+copilot@example.com',
            'telephone': '+2250700000002',
            'password1': self.password,
            'password2': self.password,
            'first_name': 'Test',
            'last_name': 'User'
        }
        response = self.client.post(self.registration_url, payload, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertTrue(User.objects.filter(email='newuser+copilot@example.com').exists())

    def test_login_with_email_succeeds(self):
        payload = {'email': self.user.email, 'password': self.password}
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)

    def test_patch_me_updates_telephone_and_allows_phone_login(self):
        access_token = self.authenticate({'email': self.user.email, 'password': self.password})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        response_patch = self.client.patch(self.me_url, {'telephone': '+2250700000009'}, format='json')
        self.assertEqual(response_patch.status_code, 200)
        self.assertEqual(response_patch.data['telephone'], '+2250700000009')

        # Verify telephone is persisted and can be used to login
        self.user.refresh_from_db()
        self.assertEqual(self.user.telephone, '+2250700000009')

        response_login_phone = self.client.post(self.login_url, {'telephone': '+2250700000009', 'password': self.password}, format='json')
        self.assertEqual(response_login_phone.status_code, 200)
        self.assertIn('access', response_login_phone.data)

    def test_me_returns_authenticated_user_profile(self):
        access_token = self.authenticate({'email': self.user.email, 'password': self.password})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['email'], self.user.email)
        self.assertEqual(response.data['user']['role'], 'client')

    def test_logout_returns_200(self):
        access_token = self.authenticate({'email': self.user.email, 'password': self.password})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        response = self.client.post(self.logout_url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('detail', response.data)

    def test_apply_prestataire_creates_request(self):
        access_token = self.authenticate({'email': self.user.email, 'password': self.password})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        response = self.client.post(self.apply_prestataire_url, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['detail'], 'Demande envoyée avec succès.')

    def test_apply_prestataire_fails_when_already_requested(self):
        access_token = self.authenticate({'email': self.user.email, 'password': self.password})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        response_first = self.client.post(self.apply_prestataire_url, format='json')
        self.assertEqual(response_first.status_code, 201)

        response_second = self.client.post(self.apply_prestataire_url, format='json')
        self.assertEqual(response_second.status_code, 400)
        self.assertIn('detail', response_second.data)
