// ══════════════════════════════════════════════════════════════
// Dressly — Forgot Password Screen (Flutter)
// ══════════════════════════════════════════════════════════════

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../constants/constants.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/widgets.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState
    extends ConsumerState<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  bool _isSent = false;
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your email address')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      // TODO: Call password reset API
      await Future.delayed(const Duration(milliseconds: 1500));
      setState(() => _isSent = true);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content:
                  Text('Failed to send reset email. Please try again.')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeProvider).colors;

    return DresslyScreen(
      scrollable: true,
      keyboardAvoiding: true,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: Spacing.xxxl),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  color: colors.accent.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _isSent ? Icons.mark_email_read_outlined : Icons.key,
                  size: 48,
                  color: colors.accent,
                ),
              ),
              const SizedBox(height: Spacing.lg),
              Text(
                _isSent ? 'Check Your Email' : 'Reset Password',
                style: TextStyle(
                  fontSize: FontSizes.xxxl,
                  fontWeight: FontWeight.w800,
                  color: colors.text,
                ),
              ),
              const SizedBox(height: Spacing.sm),
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: Spacing.xl),
                child: Text(
                  _isSent
                      ? "We've sent a password reset link to ${_emailController.text}"
                      : "Enter your email and we'll send you a reset link",
                  style: TextStyle(
                    fontSize: FontSizes.base,
                    color: colors.textSecondary,
                    height: 1.4,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: Spacing.xxl),

              if (_isSent)
                DresslyButton(
                  title: 'Back to Login',
                  onPressed: () => context.go('/auth/login'),
                  fullWidth: true,
                  size: ButtonSize.lg,
                )
              else ...[
                DresslyInput(
                  label: 'Email Address',
                  placeholder: 'you@example.com',
                  leftIcon: Icons.mail_outline,
                  keyboardType: TextInputType.emailAddress,
                  controller: _emailController,
                  textInputAction: TextInputAction.done,
                  onSubmitted: _handleSubmit,
                ),
                DresslyButton(
                  title: 'Send Reset Link',
                  onPressed: _handleSubmit,
                  loading: _isLoading,
                  fullWidth: true,
                  size: ButtonSize.lg,
                ),
              ],

              const SizedBox(height: Spacing.md),
              DresslyButton(
                title: 'Back to Login',
                variant: ButtonVariant.ghost,
                onPressed: () => context.pop(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
