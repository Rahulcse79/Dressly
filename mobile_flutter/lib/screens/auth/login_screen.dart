// ══════════════════════════════════════════════════════════════
// Dressly — Login Screen (Flutter)
// ══════════════════════════════════════════════════════════════

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../constants/constants.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/widgets.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _passwordFocus = FocusNode();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      _showError('Please fill in all fields');
      return;
    }

    try {
      await ref.read(authProvider.notifier).login(
            LoginRequest(email: email.toLowerCase(), password: password),
          );
    } catch (err) {
      final apiErr = extractApiError(err);
      if (mounted) _showError(apiErr.message);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeProvider).colors;
    final authState = ref.watch(authProvider);

    return DresslyScreen(
      scrollable: true,
      keyboardAvoiding: true,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: Spacing.xxxl),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo
              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  color: colors.primary.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.checkroom, size: 48, color: colors.primary),
              ),
              const SizedBox(height: Spacing.lg),
              Text(
                'Welcome Back',
                style: TextStyle(
                  fontSize: FontSizes.xxxl,
                  fontWeight: FontWeight.w800,
                  color: colors.text,
                ),
              ),
              const SizedBox(height: Spacing.xs),
              Text(
                'Sign in to your Dressly account',
                style: TextStyle(
                  fontSize: FontSizes.base,
                  color: colors.textSecondary,
                ),
              ),
              const SizedBox(height: Spacing.xxl),

              // Form
              DresslyInput(
                label: 'Email',
                placeholder: 'you@example.com',
                leftIcon: Icons.mail_outline,
                keyboardType: TextInputType.emailAddress,
                controller: _emailController,
                textInputAction: TextInputAction.next,
                onSubmitted: () => _passwordFocus.requestFocus(),
                onChanged: (_) =>
                    ref.read(authProvider.notifier).clearError(),
              ),
              DresslyInput(
                label: 'Password',
                placeholder: 'Enter your password',
                leftIcon: Icons.lock_outline,
                isPassword: true,
                controller: _passwordController,
                focusNode: _passwordFocus,
                textInputAction: TextInputAction.done,
                onSubmitted: _handleLogin,
                onChanged: (_) =>
                    ref.read(authProvider.notifier).clearError(),
              ),

              Align(
                alignment: Alignment.centerRight,
                child: GestureDetector(
                  onTap: () => context.push('/auth/forgot-password'),
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: Spacing.lg),
                    child: Text(
                      'Forgot Password?',
                      style: TextStyle(
                        fontSize: FontSizes.sm,
                        fontWeight: FontWeight.w600,
                        color: colors.primary,
                      ),
                    ),
                  ),
                ),
              ),

              if (authState.error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: Spacing.md),
                  child: Text(
                    authState.error!,
                    style: TextStyle(
                        fontSize: FontSizes.sm, color: colors.error),
                    textAlign: TextAlign.center,
                  ),
                ),

              DresslyButton(
                title: 'Sign In',
                onPressed: _handleLogin,
                loading: authState.isLoading,
                fullWidth: true,
                size: ButtonSize.lg,
              ),

              const SizedBox(height: Spacing.xl),

              // Register link
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    "Don't have an account? ",
                    style: TextStyle(
                      fontSize: FontSizes.md,
                      color: colors.textSecondary,
                    ),
                  ),
                  GestureDetector(
                    onTap: () => context.push('/auth/register'),
                    child: Text(
                      'Sign Up',
                      style: TextStyle(
                        fontSize: FontSizes.md,
                        fontWeight: FontWeight.w700,
                        color: colors.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
