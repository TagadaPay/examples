import { useCallback, useState, useEffect } from 'react';
import GooglePayButtonReact from '@google-pay/button-react';
import { useCardTokenization } from '@tagadapay/core-js/react';

// Google Pay constants for proper typing
const PAYMENT_METHOD_TYPE = 'CARD' as const;
const TOTAL_PRICE_STATUS = 'FINAL' as const;
const TOKENIZATION_TYPE = 'PAYMENT_GATEWAY' as const;
const DISPLAY_ITEM_TYPES = {
  SUBTOTAL: 'SUBTOTAL' as const,
  LINE_ITEM: 'LINE_ITEM' as const,
  TAX: 'TAX' as const,
} as const;

// Google Pay enum constants
const CARD_AUTH_METHODS = ['PAN_ONLY', 'CRYPTOGRAM_3DS'];
const CARD_NETWORKS = ['AMEX', 'DISCOVER', 'MASTERCARD', 'VISA'];

// Google Pay types for comprehensive implementation
interface GooglePayPaymentData {
  paymentMethodData: {
    tokenizationData: {
      token: string;
    };
    info?: {
      billingAddress?: GooglePayAddress;
    };
  };
  shippingAddress?: GooglePayAddress;
  email?: string;
  shippingOptionId?: string;
}


interface GooglePayAddress {
  name?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  locality?: string;
  administrativeArea?: string;
  countryCode?: string;
  postalCode?: string;
  phoneNumber?: string;
}

interface ShippingOption {
  id: string;
  label: string;
  description: string;
  price: string;
}

interface OrderSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
}

interface GooglePayExpressCheckoutProps {
  merchantId: string;
  merchantName: string;
  initialAmount: number; // in cents
  currency?: string;
  onSuccess: (result: {
    tagadaToken: string;
    rawToken: Record<string, unknown>;
    paymentData: GooglePayPaymentData;
    orderSummary: OrderSummary;
  }) => void;
  onError: (error: string) => void;
}

// Mock shipping calculation service
const mockShippingService = {
  calculateShipping: async (address: GooglePayAddress): Promise<ShippingOption[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const baseShipping = address.countryCode === 'US' ? 5.99 : 12.99;
    
    return [
      {
        id: 'standard',
        label: 'Standard Shipping',
        description: '5-7 business days',
        price: baseShipping.toFixed(2),
      },
      {
        id: 'express',
        label: 'Express Shipping',
        description: '2-3 business days',
        price: (baseShipping + 5.00).toFixed(2),
      },
      {
        id: 'overnight',
        label: 'Overnight Shipping',
        description: 'Next business day',
        price: (baseShipping + 15.00).toFixed(2),
      },
    ];
  },

  calculateTax: async (address: GooglePayAddress, subtotal: number): Promise<number> => {
    // Simulate tax calculation
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const taxRates: Record<string, number> = {
      'CA': 0.0875, // California
      'NY': 0.08,   // New York
      'TX': 0.0625, // Texas
      'FL': 0.06,   // Florida
    };
    
    const taxRate = taxRates[address.administrativeArea || ''] || 0.05;
    return subtotal * taxRate;
  },
};

export function GooglePayExpressCheckout({
  merchantId,
  merchantName,
  initialAmount,
  currency = 'USD',
  onSuccess,
  onError,
}: GooglePayExpressCheckoutProps) {
  const [orderSummary, setOrderSummary] = useState<OrderSummary>({
    subtotal: initialAmount / 100,
    shipping: 0,
    tax: 0,
    total: initialAmount / 100,
    currency,
  });

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string>('standard');
  const [isCalculating, setIsCalculating] = useState(false);

  const { tokenizeGooglePay, isLoading, error } = useCardTokenization({
    environment: 'development',
    autoInitialize: true,
  });


  // Calculate order totals
  const calculateOrderSummary = useCallback(async (
    shippingAddress?: GooglePayAddress,
    shippingOptionId?: string
  ): Promise<OrderSummary> => {
    const subtotal = initialAmount / 100;
    let shipping = 0;
    let tax = 0;

    if (shippingAddress) {
      // Calculate shipping cost
      const availableShipping = await mockShippingService.calculateShipping(shippingAddress);
      const selectedShipping = availableShipping.find(option => 
        option.id === (shippingOptionId || selectedShippingId)
      ) || availableShipping[0];
      
      shipping = parseFloat(selectedShipping.price);
      
      // Calculate tax
      tax = await mockShippingService.calculateTax(shippingAddress, subtotal + shipping);
    }

    const total = subtotal + shipping + tax;

    return {
      subtotal,
      shipping,
      tax,
      total,
      currency,
    };
  }, [initialAmount, currency, selectedShippingId]);

  // Handle shipping address changes
  const handleShippingAddressChange = useCallback(async (
    intermediatePaymentData: {
      callbackTrigger: string;
      shippingAddress?: GooglePayAddress;
      shippingOptionData?: { id: string };
    }
  ) => {
    setIsCalculating(true);
    
    try {
      const shippingAddress = intermediatePaymentData.shippingAddress;
      
      if (intermediatePaymentData.callbackTrigger === 'SHIPPING_ADDRESS' && shippingAddress) {
        // Calculate new shipping options and totals
        const newShippingOptions = await mockShippingService.calculateShipping(shippingAddress);
        setShippingOptions(newShippingOptions);
        
        const newOrderSummary = await calculateOrderSummary(shippingAddress, newShippingOptions[0].id);
        setOrderSummary(newOrderSummary);
        setSelectedShippingId(newShippingOptions[0].id);

        return {
          newShippingOptionParameters: {
            defaultSelectedOptionId: newShippingOptions[0].id,
            shippingOptions: newShippingOptions.map(option => ({
              id: option.id,
              label: option.label,
              description: `$${option.price} - ${option.description}`,
            })),
          },
          newTransactionInfo: {
            totalPriceStatus: TOTAL_PRICE_STATUS,
            totalPrice: newOrderSummary.total.toFixed(2),
            currencyCode: currency,
            displayItems: [
              {
                label: 'Subtotal',
                type: DISPLAY_ITEM_TYPES.SUBTOTAL,
                price: newOrderSummary.subtotal.toFixed(2),
              },
              {
                label: 'Shipping',
                type: DISPLAY_ITEM_TYPES.LINE_ITEM,
                price: newOrderSummary.shipping.toFixed(2),
              },
              {
                label: 'Tax',
                type: DISPLAY_ITEM_TYPES.TAX,
                price: newOrderSummary.tax.toFixed(2),
              },
            ],
          },
        };
      }

      if (intermediatePaymentData.callbackTrigger === 'SHIPPING_OPTION' && intermediatePaymentData.shippingOptionData) {
        // Update totals based on selected shipping option
        const newOrderSummary = await calculateOrderSummary(
          shippingAddress,
          intermediatePaymentData.shippingOptionData.id
        );
        setOrderSummary(newOrderSummary);
        setSelectedShippingId(intermediatePaymentData.shippingOptionData.id);

        return {
          newTransactionInfo: {
            totalPriceStatus: TOTAL_PRICE_STATUS,
            totalPrice: newOrderSummary.total.toFixed(2),
            currencyCode: currency,
            displayItems: [
              {
                label: 'Subtotal',
                type: DISPLAY_ITEM_TYPES.SUBTOTAL,
                price: newOrderSummary.subtotal.toFixed(2),
              },
              {
                label: 'Shipping',
                type: DISPLAY_ITEM_TYPES.LINE_ITEM,
                price: newOrderSummary.shipping.toFixed(2),
              },
              {
                label: 'Tax',
                type: DISPLAY_ITEM_TYPES.TAX,
                price: newOrderSummary.tax.toFixed(2),
              },
            ],
          },
        };
      }

      return {};
    } catch (error) {
      console.error('Error calculating shipping:', error);
      return {
        error: {
          reason: 'SHIPPING_ADDRESS_UNSERVICEABLE',
          message: 'Unable to calculate shipping for this address',
          intent: intermediatePaymentData.callbackTrigger,
        },
      };
    } finally {
      setIsCalculating(false);
    }
  }, [calculateOrderSummary, currency]);

  // Handle payment authorization
  const handleGooglePayAuthorized = useCallback(
    async (paymentData: GooglePayPaymentData): Promise<{ transactionState: 'SUCCESS' | 'ERROR' }> => {
      try {
        // Extract Google Pay token
        const googlePayTokenString = paymentData.paymentMethodData.tokenizationData.token;
        const googlePayToken = JSON.parse(googlePayTokenString);

        // Tokenize with core-js
        const { tagadaToken, rawToken } = await tokenizeGooglePay(googlePayToken);

        // Calculate final order summary
        const finalOrderSummary = await calculateOrderSummary(
          paymentData.shippingAddress,
          paymentData.shippingOptionId
        );

        // Success callback with all data
        onSuccess({
          tagadaToken,
          rawToken: rawToken as unknown as Record<string, unknown>,
          paymentData,
          orderSummary: finalOrderSummary,
        });

        return { transactionState: 'SUCCESS' };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Google Pay error';
        onError(errorMessage);
        return { transactionState: 'ERROR' };
      }
    },
    [tokenizeGooglePay, onSuccess, onError, calculateOrderSummary]
  );

  // Handle Google Pay errors
  const handleGooglePayError = useCallback(
    (error: unknown) => {
      console.error('Google Pay error:', error);
      const errorMessage = (error as { statusMessage?: string })?.statusMessage || 'Google Pay error occurred';
      onError(errorMessage);
    },
    [onError]
  );

  // Initialize shipping options
  useEffect(() => {
    const initializeShipping = async () => {
      try {
        // Default US address for initial shipping calculation
        const defaultAddress: GooglePayAddress = {
          countryCode: 'US',
          administrativeArea: 'CA',
          locality: 'San Francisco',
        };
        
        const initialShippingOptions = await mockShippingService.calculateShipping(defaultAddress);
        setShippingOptions(initialShippingOptions);
        
        const initialOrderSummary = await calculateOrderSummary(defaultAddress, initialShippingOptions[0].id);
        setOrderSummary(initialOrderSummary);
      } catch (error) {
        console.error('Error initializing shipping:', error);
      }
    };

    initializeShipping();
  }, [calculateOrderSummary]);

  // Show error from core-js if any
  if (error) {
    onError(error);
  }

  // Generate comprehensive Google Pay request
  const paymentRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
      {
        type: PAYMENT_METHOD_TYPE,
        parameters: {
          allowedAuthMethods: CARD_AUTH_METHODS,
          allowedCardNetworks: CARD_NETWORKS,
          billingAddressRequired: true,
          billingAddressParameters: {
            format: 'FULL',
            phoneNumberRequired: true,
          },
        },
        tokenizationSpecification: {
          type: TOKENIZATION_TYPE,
          parameters: {
            gateway: 'basistheory',
            gatewayMerchantId: '0b283fa3-44a1-4535-adff-e99ad0a58a47',
          },
        },
      },
    ],
    merchantInfo: {
      merchantId,
      merchantName,
    },
    transactionInfo: {
      totalPriceStatus: TOTAL_PRICE_STATUS,
      totalPrice: orderSummary.total.toFixed(2),
      currencyCode: currency,
      displayItems: [
        {
          label: 'Subtotal',
          type: 'SUBTOTAL',
          price: orderSummary.subtotal.toFixed(2),
        },
        {
          label: 'Shipping',
          type: 'LINE_ITEM',
          price: orderSummary.shipping.toFixed(2),
        },
        {
          label: 'Tax',
          type: 'TAX',
          price: orderSummary.tax.toFixed(2),
        },
      ],
    },
    // Express checkout features
    shippingAddressRequired: true,
    shippingOptionRequired: true,
    emailRequired: true,
    callbackIntents: ['SHIPPING_ADDRESS', 'SHIPPING_OPTION', 'PAYMENT_AUTHORIZATION'],
    shippingOptionParameters: {
      defaultSelectedOptionId: selectedShippingId,
      shippingOptions: shippingOptions.map(option => ({
        id: option.id,
        label: option.label,
        description: `$${option.price} - ${option.description}`,
      })),
    },
  };

  return (
    <div className="w-full">
      {/* Order Summary Display */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Order Summary</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${orderSummary.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping:</span>
            <span>${orderSummary.shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>${orderSummary.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-1">
            <span>Total:</span>
            <span>${orderSummary.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Google Pay Button */}
      {isLoading || isCalculating ? (
        <div className="bg-white hover:bg-slate-50 text-slate-900 font-semibold py-6 px-8 rounded-xl transition-all duration-200 shadow-lg border-2 border-slate-200 flex items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
          <span className="text-lg">
            {isCalculating ? 'Calculating...' : 'Processing...'}
          </span>
        </div>
      ) : (
        <GooglePayButtonReact
          environment="TEST"
          paymentRequest={paymentRequest as any}
          onPaymentAuthorized={handleGooglePayAuthorized}
          onPaymentDataChanged={handleShippingAddressChange as any}
          onError={handleGooglePayError}
          existingPaymentMethodRequired={false}
          buttonColor="black"
          buttonType="checkout"
          buttonSizeMode="fill"
          className="w-full h-12 rounded-xl"
        />
      )}

      {/* Shipping Options Display (for demo) */}
      {shippingOptions.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2">Available Shipping Options:</h4>
          <div className="space-y-2 text-sm">
            {shippingOptions.map(option => (
              <div key={option.id} className="flex justify-between">
                <span>
                  {option.label} - {option.description}
                </span>
                <span>${option.price}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default GooglePayExpressCheckout;
