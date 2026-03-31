import 'dart:math' as math;
import 'package:flutter/material.dart';

class AuthBackground extends StatelessWidget {
  final Widget child;

  const AuthBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);

    return Container(
      width: size.width,
      height: size.height,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFF1A1208),
            Color(0xFF0F0B06),
            Color(0xFF080604),
            Color(0xFF0A0A0A),
          ],
          stops: [0.0, 0.35, 0.65, 1.0],
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            top: size.height * 0.02,
            left: size.width * 0.1,
            child: _GlowOrb(
              diameter: 180,
              color: const Color(0xFFC8960A),
              opacity: 0.12,
            ),
          ),
          Positioned(
            top: size.height * 0.06,
            right: size.width * 0.15,
            child: _GlowOrb(
              diameter: 120,
              color: const Color(0xFFE8A630),
              opacity: 0.09,
            ),
          ),
          Positioned(
            top: -20,
            right: -30,
            child: _GlowOrb(
              diameter: 200,
              color: const Color(0xFFAA7B1C),
              opacity: 0.08,
            ),
          ),
          Positioned(
            top: size.height * 0.18,
            left: size.width * 0.3,
            child: _GlowOrb(
              diameter: 60,
              color: const Color(0xFFD4AF37),
              opacity: 0.15,
            ),
          ),
          Positioned(
            top: size.height * 0.25,
            right: size.width * 0.2,
            child: _GlowOrb(
              diameter: 100,
              color: const Color(0xFFE53935),
              opacity: 0.05,
            ),
          ),
          Positioned(
            bottom: size.height * 0.15,
            left: size.width * 0.4,
            child: _GlowOrb(
              diameter: 250,
              color: const Color(0xFF8B6914),
              opacity: 0.04,
            ),
          ),
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withOpacity(0.3),
                    Colors.black.withOpacity(0.7),
                  ],
                  stops: const [0.0, 0.4, 1.0],
                ),
              ),
            ),
          ),
          child,
        ],
      ),
    );
  }
}

class _GlowOrb extends StatelessWidget {
  final double diameter;
  final Color color;
  final double opacity;

  const _GlowOrb({
    required this.diameter,
    required this.color,
    required this.opacity,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: diameter,
      height: diameter,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [
            color.withOpacity(opacity),
            color.withOpacity(opacity * 0.5),
            color.withOpacity(0),
          ],
          stops: const [0.0, 0.4, 1.0],
        ),
      ),
    );
  }
}
