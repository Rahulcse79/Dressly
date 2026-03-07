// ══════════════════════════════════════════════════════════════
// Dressly — Register Screen (Flutter)
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

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();
  final _confirmFocus = FocusNode();

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    _emailFocus.dispose();
    _passwordFocus.dispose();
    _confirmFocus.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();
    final confirm = _confirmController.text.trim();
    final name = _nameController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      _showError('Email and password are required');
      return;
    }
    if (password.length < Limits.passwordMinLength) {
      _showError(
          'Password must be at least ${Limits.passwordMinLength} characters');
      return;
    }
    if (password != confirm) {
      _showError('Passwords do not match');
      return;
    }

    try {
      await ref.read(authProvider.notifier).register(
            RegisterRequest(
              email: email.toLowerCase(),
              password: password,
              displayName: name.isNotEmpty ? name : null,
            ),
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
          padding: const EdgeInsets.symmetric(vertical: Spacing.xxl),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Header
              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  color: colors.secondary.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.auto_awesome, size: 48, color: colors.secondary),
              ),
              const SizedBox(height: Spacing.lg),
              Text(
                'Create Account',
                style: TextStyle(
                  fontSize: FontSizes.xxxl,
                  fontWeight: FontWeight.w800,
                  color: colors.text,
                ),
              ),
              const SizedBox(height: Spacing.xs),
              Text(
                'Join Dressly and elevate your style',
                style: TextStyle(
                  fontSize: FontSizes.base,
                  color: colors.textSecondary,
                ),
              ),
              const SizedBox(height: Spacing.xl),

              // Form
              DresslyInput(
                label: 'Display Name (optional)',
                placeholder: 'What should we call you?',
                leftIcon: Icons.person_outline,
                controller: _nameController,
                textInputAction: TextInputAction.next,
                onSubmitted: () => _emailFocus.requestFocus(),
              ),
              DresslyInput(
                label: 'Email',
                placeholder: 'you@example.com',
                leftIcon: Icons.mail_outline,
                keyboardType: TextInputType.emailAddress,
                controller: _emailController,
                focusNode: _emailFocus,
                textInputAction: TextInputAction.next,
                onSubmitted: () => _passwordFocus.requestFocus(),
                onChanged: (_) =>
                    ref.read(authProvider.notifier).clearError(),
              ),
              DresslyInput(
                label: 'Password',
                placeholder: 'Min 8 characters',
                leftIcon: Icons.lock_outline,
                isPassword: true,
                controller: _passwordController,
                focusNode: _passwordFocus,
                textInputAction: TextInputAction.next,
                onSubmitted: () => _confirmFocus.requestFocus(),
                hint:
                    'Minimum ${Limits.passwordMinLength} characters with upper, lower, number, and symbol',
              ),
              DresslyInput(
                label: 'Confirm Password',
                placeholder: 'Re-enter your password',
                leftIcon: Icons.shield_outlined,
                isPassword: true,
                controller: _confirmController,
                focusNode: _confirmFocus,
                textInputAction: TextInputAction.done,
                onSubmitted: _handleRegister,
                error: _confirmController.text.isNotEmpty &&
                        _passwordController.text != _confirmController.text
                    ? 'Passwords do not match'
                    : null,
              ),

              DresslyButton(
                title: 'Create Account',
                onPressed: _handleRegister,
                loading: authState.isLoading,
                fullWidth: true,
                size: ButtonSize.lg,
              ),

              const SizedBox(height: Spacing.xl),

              // Login link
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Already have an account? ',
                    style: TextStyle(
                      fontSize: FontSizes.md,
                      color: colors.textSecondary,
                    ),
                  ),
                  GestureDetector(
                    onTap: () => context.push('/auth/login'),
                    child: Text(
                      'Sign In',
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
