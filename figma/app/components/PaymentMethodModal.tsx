import { useState } from 'react';
import { X, CreditCard, Lock } from 'lucide-react';
import { WarmCard } from './WarmCard';
import { WarmButton } from './WarmButton';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';

type PaymentMethodModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PaymentData) => void;
};

type PaymentData = {
  cardholderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  billingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
};

export function PaymentMethodModal({ isOpen, onClose, onSave }: PaymentMethodModalProps) {
  const [formData, setFormData] = useState<PaymentData>({
    cardholderName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    billingAddress: {
      street: '',
      city: '',
      postalCode: '',
      country: 'Estonia',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }

    const cardNumberClean = formData.cardNumber.replace(/\s/g, '');
    if (!cardNumberClean || cardNumberClean.length < 13 || cardNumberClean.length > 19) {
      newErrors.cardNumber = 'Invalid card number';
    }

    if (!formData.expiryMonth || parseInt(formData.expiryMonth) < 1 || parseInt(formData.expiryMonth) > 12) {
      newErrors.expiryMonth = 'Invalid month';
    }

    const currentYear = new Date().getFullYear();
    if (!formData.expiryYear || parseInt(formData.expiryYear) < currentYear) {
      newErrors.expiryYear = 'Invalid year';
    }

    if (!formData.cvv || formData.cvv.length < 3 || formData.cvv.length > 4) {
      newErrors.cvv = 'Invalid CVV';
    }

    if (!formData.billingAddress.street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!formData.billingAddress.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.billingAddress.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required';
    }

    if (!formData.billingAddress.country.trim()) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
      toast.success('Payment method updated successfully!');
      onClose();
    } else {
      toast.error('Please fix the errors in the form');
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 mb-4 sm:mb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <WarmCard padding="lg" className="relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FFF9ED] hover:bg-[#FFE5B4] flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-[#6B5744]" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#2D2721]">
                Update Payment Method
              </h3>
            </div>
            <p className="text-[#6B5744] text-sm">
              Add or update your payment information
            </p>
          </div>

          {/* Security Notice */}
          <div className="mb-6 p-4 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-lg flex items-start gap-3">
            <Lock className="h-5 w-5 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#2D2721] mb-1">Secure Payment</p>
              <p className="text-xs text-[#6B5744]">
                Your payment information is encrypted and secure. We never store your CVV.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cardholder Name */}
            <div className="space-y-2">
              <Label htmlFor="cardholderName" className="text-[#2D2721] font-medium">
                Cardholder Name <span className="text-[#E17B5C]">*</span>
              </Label>
              <Input
                id="cardholderName"
                value={formData.cardholderName}
                onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value })}
                className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                placeholder="John Doe"
              />
              {errors.cardholderName && (
                <p className="text-xs text-[#E17B5C]">{errors.cardholderName}</p>
              )}
            </div>

            {/* Card Number */}
            <div className="space-y-2">
              <Label htmlFor="cardNumber" className="text-[#2D2721] font-medium">
                Card Number <span className="text-[#E17B5C]">*</span>
              </Label>
              <Input
                id="cardNumber"
                value={formData.cardNumber}
                onChange={(e) => setFormData({ ...formData, cardNumber: formatCardNumber(e.target.value) })}
                className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12 font-mono"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
              {errors.cardNumber && (
                <p className="text-xs text-[#E17B5C]">{errors.cardNumber}</p>
              )}
            </div>

            {/* Expiry & CVV */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryMonth" className="text-[#2D2721] font-medium">
                  Month <span className="text-[#E17B5C]">*</span>
                </Label>
                <Input
                  id="expiryMonth"
                  type="number"
                  min="1"
                  max="12"
                  value={formData.expiryMonth}
                  onChange={(e) => setFormData({ ...formData, expiryMonth: e.target.value })}
                  className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                  placeholder="MM"
                  maxLength={2}
                />
                {errors.expiryMonth && (
                  <p className="text-xs text-[#E17B5C]">{errors.expiryMonth}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryYear" className="text-[#2D2721] font-medium">
                  Year <span className="text-[#E17B5C]">*</span>
                </Label>
                <Input
                  id="expiryYear"
                  type="number"
                  min={new Date().getFullYear()}
                  value={formData.expiryYear}
                  onChange={(e) => setFormData({ ...formData, expiryYear: e.target.value })}
                  className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                  placeholder="YYYY"
                  maxLength={4}
                />
                {errors.expiryYear && (
                  <p className="text-xs text-[#E17B5C]">{errors.expiryYear}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv" className="text-[#2D2721] font-medium">
                  CVV <span className="text-[#E17B5C]">*</span>
                </Label>
                <Input
                  id="cvv"
                  type="password"
                  value={formData.cvv}
                  onChange={(e) => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '') })}
                  className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12 font-mono"
                  placeholder="123"
                  maxLength={4}
                />
                {errors.cvv && (
                  <p className="text-xs text-[#E17B5C]">{errors.cvv}</p>
                )}
              </div>
            </div>

            {/* Billing Address */}
            <div className="pt-4 border-t border-[rgba(139,115,85,0.1)]">
              <h4 className="text-lg font-semibold text-[#2D2721] mb-4">Billing Address</h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street" className="text-[#2D2721] font-medium">
                    Street Address <span className="text-[#E17B5C]">*</span>
                  </Label>
                  <Input
                    id="street"
                    value={formData.billingAddress.street}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      billingAddress: { ...formData.billingAddress, street: e.target.value }
                    })}
                    className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                    placeholder="Narva mnt 7"
                  />
                  {errors.street && (
                    <p className="text-xs text-[#E17B5C]">{errors.street}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-[#2D2721] font-medium">
                      City <span className="text-[#E17B5C]">*</span>
                    </Label>
                    <Input
                      id="city"
                      value={formData.billingAddress.city}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        billingAddress: { ...formData.billingAddress, city: e.target.value }
                      })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                      placeholder="Tallinn"
                    />
                    {errors.city && (
                      <p className="text-xs text-[#E17B5C]">{errors.city}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode" className="text-[#2D2721] font-medium">
                      Postal Code <span className="text-[#E17B5C]">*</span>
                    </Label>
                    <Input
                      id="postalCode"
                      value={formData.billingAddress.postalCode}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        billingAddress: { ...formData.billingAddress, postalCode: e.target.value }
                      })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                      placeholder="10117"
                    />
                    {errors.postalCode && (
                      <p className="text-xs text-[#E17B5C]">{errors.postalCode}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-[#2D2721] font-medium">
                      Country <span className="text-[#E17B5C]">*</span>
                    </Label>
                    <Input
                      id="country"
                      value={formData.billingAddress.country}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        billingAddress: { ...formData.billingAddress, country: e.target.value }
                      })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                      placeholder="Estonia"
                    />
                    {errors.country && (
                      <p className="text-xs text-[#E17B5C]">{errors.country}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 pt-6 border-t border-[rgba(139,115,85,0.1)]">
              <WarmButton
                variant="outline"
                className="flex-1"
                onClick={onClose}
                type="button"
              >
                Cancel
              </WarmButton>
              <WarmButton
                className="flex-1"
                type="submit"
              >
                <Lock className="h-4 w-4 mr-2" />
                Save Payment Method
              </WarmButton>
            </div>
          </form>
        </WarmCard>
      </div>
    </div>
  );
}
