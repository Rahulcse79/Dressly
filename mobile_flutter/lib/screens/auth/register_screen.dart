// ══════════════════════════════════════════════════════════════
// Dressly — Register Screen (Flutter)
// Dark luxury fashion aesthetic
// ══════════════════════════════════════════════════════════════

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../constants/constants.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/widgets.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen>
    with SingleTickerProviderStateMixin {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();
  final _confirmFocus = FocusNode();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  late AnimationController _animController;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _fadeAnim = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOut,
    );
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.12),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOutCubic,
    ));
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
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
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white, size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Text(message,
                  style: const TextStyle(fontWeight: FontWeight.w500)),
            ),
          ],
        ),
        backgroundColor: const Color(0xFFE53935),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light.copyWith(
        statusBarColor: Colors.transparent,
      ),
      child: Scaffold(
        backgroundColor: const Color(0xFF0A0A0A),
        resizeToAvoidBottomInset: true,
        body: GestureDetector(
          behavior: HitTestBehavior.translucent,
          onTap: () => FocusScope.of(context).unfocus(),
          child: AuthBackground(
            child: SafeArea(
              child: SingleChildScrollView(
                keyboardDismissBehavior:
                    ScrollViewKeyboardDismissBehavior.onDrag,
                padding: const EdgeInsets.only(
                  left: 28,
                  right: 28,
                  bottom: 20,
                ),
                child: FadeTransition(
                  opacity: _fadeAnim,
                  child: SlideTransition(
                    position: _slideAnim,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(
                            height: MediaQuery.sizeOf(context).height * 0.05),

                        // ── Back Button ──
                        GestureDetector(
                          onTap: () => context.pop(),
                          child: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.07),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: Colors.white.withOpacity(0.10),
                              ),
                            ),
                            child: Icon(
                              Icons.arrow_back_ios_new,
                              size: 16,
                              color: Colors.white.withOpacity(0.7),
                            ),
                          ),
                        ),

                        const SizedBox(height: 24),

                        // ── DRESSLY Logo ──
                        const Text(
                          'DRESSLY',
                          style: TextStyle(
                            fontSize: 36,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFFE53935),
                            letterSpacing: 3,
                            height: 1.1,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'CREATE YOUR\nACCOUNT',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            letterSpacing: 0.5,
                            height: 1.15,
                          ),
                        ),
                        const SizedBox(height: 32),

                        // ── Name Field ──
                        const Text(
                          'Display Name',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        _buildGlassInput(
                          controller: _nameController,
                          hint: 'What should we call you?',
                          icon: Icons.person_outline,
                          textInputAction: TextInputAction.next,
                          onSubmitted: () => _emailFocus.requestFocus(),
                        ),
                        const SizedBox(height: 16),

                        // ── Email Field ──
                        const Text(
                          'Email',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        _buildGlassInput(
                          controller: _emailController,
                          hint: 'you@example.com',
                          icon: Icons.mail_outline,
                          keyboardType: TextInputType.emailAddress,
                          focusNode: _emailFocus,
                          textInputAction: TextInputAction.next,
                          onSubmitted: () => _passwordFocus.requestFocus(),
                          onChanged: (_) =>
                              ref.read(authProvider.notifier).clearError(),
                        ),
                        const SizedBox(height: 16),

                        // ── Password Field ──
                        const Text(
                          'Password',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        _buildGlassInput(
                          controller: _passwordController,
                          hint: 'Min ${Limits.passwordMinLength} characters',
                          icon: Icons.lock_outline,
                          isPassword: true,
                          obscure: _obscurePassword,
                          onToggleObscure: () => setState(
                              () => _obscurePassword = !_obscurePassword),
                          focusNode: _passwordFocus,
                          textInputAction: TextInputAction.next,
                          onSubmitted: () => _confirmFocus.requestFocus(),
                        ),
                        const SizedBox(height: 16),

                        // ── Confirm Password Field ──
                        const Text(
                          'Confirm Password',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        _buildGlassInput(
                          controller: _confirmController,
                          hint: 'Re-enter your password',
                          icon: Icons.shield_outlined,
                          isPassword: true,
                          obscure: _obscureConfirm,
                          onToggleObscure: () => setState(
                              () => _obscureConfirm = !_obscureConfirm),
                          focusNode: _confirmFocus,
                          textInputAction: TextInputAction.done,
                          onSubmitted: _handleRegister,
                        ),

                        // ── Password Mismatch Error ──
                        if (_confirmController.text.isNotEmpty &&
                            _passwordController.text !=
                                _confirmController.text)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline,
                                    size: 14, color: Color(0xFFEF5350)),
                                const SizedBox(width: 6),
                                Text(
                                  'Passwords do not match',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: const Color(0xFFEF5350)
                                        .withOpacity(0.9),
                                  ),
                                ),
                              ],
                            ),
                          ),

                        // ── Error Message ──
                        if (authState.error != null)
                          Container(
                            margin: const EdgeInsets.only(top: 16),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE53935).withOpacity(0.15),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color:
                                    const Color(0xFFE53935).withOpacity(0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline,
                                    size: 18, color: Color(0xFFEF5350)),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    authState.error!,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      color: Color(0xFFEF5350),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                        const SizedBox(height: 28),

                        // ── Create Account Button ──
                        SizedBox(
                          width: double.infinity,
                          height: 56,
                          child: ElevatedButton(
                            onPressed:
                                authState.isLoading ? null : _handleRegister,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFE53935),
                              foregroundColor: Colors.white,
                              disabledBackgroundColor:
                                  const Color(0xFFE53935).withOpacity(0.5),
                              elevation: 8,
                              shadowColor:
                                  const Color(0xFFE53935).withOpacity(0.4),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            child: authState.isLoading
                                ? const SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Text(
                                    'Create Account',
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                          ),
                        ),

                        const SizedBox(height: 24),

                        // ── Sign In Link ──
                        Center(
                          child: GestureDetector(
                            onTap: () => context.push('/auth/login'),
                            child: RichText(
                              text: const TextSpan(
                                style: TextStyle(fontSize: 14, height: 1.5),
                                children: [
                                  TextSpan(
                                    text: 'Already have an account?  ',
                                    style: TextStyle(
                                      color: Color(0xFFB0B0B0),
                                    ),
                                  ),
                                  TextSpan(
                                    text: 'Sign in.',
                                    style: TextStyle(
                                      color: Color(0xFFD4AF37),
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 30),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ── Glassmorphism Input Field ──────────────────────────────

  Widget _buildGlassInput({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool isPassword = false,
    bool obscure = true,
    VoidCallback? onToggleObscure,
    FocusNode? focusNode,
    TextInputType? keyboardType,
    TextInputAction? textInputAction,
    VoidCallback? onSubmitted,
    ValueChanged<String>? onChanged,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.07),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: Colors.white.withOpacity(0.10),
        ),
      ),
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        obscureText: isPassword && obscure,
        keyboardType: keyboardType,
        textInputAction: textInputAction,
        onChanged: onChanged,
        onSubmitted: onSubmitted != null ? (_) => onSubmitted() : null,
        cursorColor: const Color(0xFFE53935),
        style: const TextStyle(
          fontSize: 16,
          color: Colors.white,
          fontWeight: FontWeight.w400,
        ),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(
            color: Colors.white.withOpacity(0.3),
            fontWeight: FontWeight.w400,
          ),
          prefixIcon: Icon(
            icon,
            size: 20,
            color: Colors.white.withOpacity(0.4),
          ),
          suffixIcon: isPassword
              ? GestureDetector(
                  onTap: onToggleObscure,
                  child: Icon(
                    obscure
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined,
                    size: 20,
                    color: Colors.white.withOpacity(0.4),
                  ),
                )
              : null,
          border: InputBorder.none,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        ),
      ),
    );
  }
}
