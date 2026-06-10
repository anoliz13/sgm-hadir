import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../core/constants/app_colors.dart';

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({super.key});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  final MobileScannerController _controller = MobileScannerController();
  bool _isProcessing = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_isProcessing) return;
    final barcode = capture.barcodes.firstOrNull;
    if (barcode?.rawValue == null) return;

    _isProcessing = true;
    final raw = barcode!.rawValue!;

    final parts = raw.split('|');
    if (parts.length >= 2 && parts[0] == 'SGMHADIR') {
      Navigator.pop(context, {
        'raw': raw,
        'branch_id': parts.length > 1 ? parts[1] : '',
        'timestamp': parts.length > 2 ? parts[2] : '',
      });
    } else {
      _isProcessing = false;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('QR Code tidak valid. Scan QR resmi SGM Hadir.'),
          backgroundColor: AppColors.danger,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('Scan QR Check-in'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        actions: [
          ValueListenableBuilder<MobileScannerState>(
            valueListenable: _controller,
            builder: (context, state, child) {
              final torch = state.torchState;
              return IconButton(
                icon: Icon(
                  torch == TorchState.on
                      ? Icons.flash_on
                      : Icons.flash_off,
                  color: Colors.white,
                ),
                onPressed: () => _controller.toggleTorch(),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.switch_camera, color: Colors.white),
            onPressed: () => _controller.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
          ),
          // Overlay scan area
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.accent, width: 3),
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
          // Bottom info
          Positioned(
            bottom: 80,
            left: 0,
            right: 0,
            child: Column(
              children: [
                const Icon(Icons.qr_code_scanner,
                    color: Colors.white70, size: 32),
                const SizedBox(height: 8),
                Text(
                  'Arahkan kamera ke QR Code\n yang tersedia di kantor Anda',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
