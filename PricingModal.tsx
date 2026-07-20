import { useState } from 'react';
import { Dialog, Button } from '@efi/efi-ui-components';
import './PricingModal.css';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PricingModalProps {
    isOpen:         boolean;
    price:          number;           // from GET /api/reports/pricing/{reportOrderId}
    reportOrderId:  number;           // created in step 1 (PENDING)
    onBack:         () => void;       // go back to form + rollback PENDING order
    onCancel:       () => void;       // close everything + rollback PENDING order
    onConfirm:      (reportOrderId: number) => Promise<void>; // PATCH confirm → RUNNING
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PricingModal({
    isOpen,
    price,
    reportOrderId,
    onBack,
    onCancel,
    onConfirm,
}: PricingModalProps) {
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState<string | null>(null);

    if (!isOpen) return null;

    const handleOrderReport = async () => {
        setLoading(true);
        setError(null);
        try {
            await onConfirm(reportOrderId);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pm">
            <Dialog onClose={onCancel} closeLabel="Cancel">
                <Dialog.Content>
                    <div className="pm__inner">

                        {/* Title */}
                        <h3 className="pm__title">Report costs and availability</h3>
                        <hr className="pm__divider" />

                        {/* Two column body */}
                        <div className="pm__body">

                            {/* Left — costs */}
                            <div className="pm__col">
                                <h4 className="pm__col-title">Report costs</h4>
                                <p className="pm__price-label">Price of the report*:</p>
                                <p className="pm__price">{price}€</p>
                                <p className="pm__footnote">*Price includes...</p>
                            </div>

                            {/* Right — availability */}
                            <div className="pm__col">
                                <h4 className="pm__col-title">Report availability</h4>
                                <p className="pm__text">
                                    The report will be completed the following day,
                                    and you will receive a notification by email.
                                </p>
                                <p className="pm__text pm__text--mt">
                                    Once the report is completed, it will be available
                                    for 60 days. During this period, you can download
                                    different versions of the report at no additional cost.
                                </p>
                            </div>

                        </div>

                        {/* Error */}
                        {error && (
                            <div className="pm__error">⚠ {error}</div>
                        )}

                    </div>
                </Dialog.Content>

                {/* Footer buttons — CANCEL left | BACK + ORDER REPORT right */}
                <Dialog.Buttons>
                    <div className="pm__footer">
                        <div className="pm__footer-left">
                            <Button
                                variant="secondary"
                                onClick={onCancel}
                                disabled={loading}
                            >
                                CANCEL
                            </Button>
                        </div>
                        <div className="pm__footer-right">
                            <Button
                                variant="secondary"
                                onClick={onBack}
                                disabled={loading}
                            >
                                BACK
                            </Button>
                            <Button
                                onClick={handleOrderReport}
                                disabled={loading}
                            >
                                {loading ? 'Ordering...' : 'ORDER REPORT'}
                            </Button>
                        </div>
                    </div>
                </Dialog.Buttons>
            </Dialog>
        </div>
    );
}
