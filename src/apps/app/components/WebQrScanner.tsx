type WebQrScannerProps = {
  label: string;
  disabled?: boolean;
  onClose: () => void;
  onManual?: () => void;
  onScanned: (data: string) => void;
};

export default function WebQrScanner(_props: WebQrScannerProps) {
  return null;
}
