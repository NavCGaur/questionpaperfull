import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useInitiatePaymentMutation, useVerifyPaymentQuery } from "../../../state/api";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import "./Payment.css";

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const paperId = location.state?.paperId;

  console.log("paymenttype", location.state?.type);
  const paymentType = location.state?.type || 'question'; // Default to 'answer' if not specified
  const CASHFREE_MODE = process.env.REACT_APP_MODE;

  const [initiatePayment, { isLoading, isError, error }] = useInitiatePaymentMutation();
  const [orderId, setOrderId] = useState(null);
  const paymentInitializedRef = useRef(false);

  const { data: paymentStatus, refetch } = useVerifyPaymentQuery({ orderId, type: paymentType },{
    skip: !orderId,
  });

  const startPayment = useCallback(async () => {
    if (paymentInitializedRef.current) return;
    paymentInitializedRef.current = true;
    
    try {
      // Include the payment type in the payload
      const paymentDetails = { paperId, currency: "INR", type: paymentType };
      const response = await initiatePayment(paymentDetails).unwrap();
      if (!response?.payment_session_id || !response?.order_id) {
        throw new Error("Invalid payment session or order ID");
      }
      setOrderId(response.order_id);
      
      if (!window.Cashfree) {
        throw new Error("Cashfree SDK not loaded");
      }
      
      const cashfree = new window.Cashfree();
      cashfree.checkout({
        paymentSessionId: response.payment_session_id,
        mode: CASHFREE_MODE,
        paymentMethods: ["upi"],
        style: {
          background: "var(--color-footer)",
          color: "#11385b",
          theme: "dark",
          errorColor: "#ff0000",
          successColor: "#4BB543",
        },
        onSuccess: (data) => {
          console.log("Payment Success:", data);
          refetch();
        },
        onFailure: (error) => {
          console.error("Payment Failure:", error);
          navigate("/payment-failure", { state: { errorData: error } });
        },
      });
    } catch (err) {
      console.error("Error initiating payment:", err);
      paymentInitializedRef.current = false;
    }
  }, [initiatePayment, navigate, paperId, paymentType, refetch, CASHFREE_MODE]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!paymentInitializedRef.current) {
        startPayment();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [startPayment]);

  useEffect(() => {
    if (paymentStatus?.paymentStatus === "SUCCESS") {
      navigate("/payment-status", { 
        state: { 
          paymentData: paymentStatus,
          paymentType: paymentType 
        } 
      });
    } else if (paymentStatus?.paymentStatus === "FAILED") {
      navigate("/payment-failure", { 
        state: { 
          errorData: paymentStatus,
          paymentType: paymentType 
        } 
      });
    }
  }, [paymentStatus, navigate, paymentType]);

  // Calculate the price based on the payment type
  const price = paymentType === 'question' ? '₹2' : '₹5';

  return (
    <div className="payment">
      <h1 className="payment__title">Secure Payment</h1>
      <div className="payment__details">
        <h2>Payment for {paymentType === 'question' ? 'Question Paper' : 'Answer Paper'}</h2>
        <p className="payment__price">Amount: {price}</p>
      </div>
      {isLoading && (
        <div className="payment__status payment__status--loading">
          <CircularProgress size={24} /> <span>Initializing payment...</span>
        </div>
      )}
      {isError && (
        <div className="payment__status payment__status--error">
          <ErrorIcon className="payment__icon" /> <span>{error?.data?.message || "Unable to process payment"}</span>
        </div>
      )}
      {paymentStatus?.paymentStatus === "PENDING" && (
        <div className="payment__status payment__status--pending">
          <WarningAmberIcon className="payment__icon" /> <span>Payment is being processed. Please wait...</span>
        </div>
      )}
      {paymentStatus?.paymentStatus === "SUCCESS" && (
        <div className="payment__status payment__status--success">
          <CheckCircleIcon className="payment__icon" /> <span>Payment Successful!</span>
        </div>
      )}
      <div id="payment-form" className="payment__form" />
    </div>
  );
};

export default Payment;