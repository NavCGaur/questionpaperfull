import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useVerifyPaymentQuery } from "../../../state/api";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import FileDownloadDoneIcon from "@mui/icons-material/FileDownloadDone";
import "./PaymentVerification.css";

const PaymentVerification = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const orderId = params.get("order_id");
  // Get payment type from state or query params
  const paymentType = location.state?.paymentType || params.get("type") || "answer";

  const MAX_ATTEMPTS = 10;
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState("Verifying your payment...");
  const [stopPolling, setStopPolling] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const downloadStarted = useRef(false);

  const { data: paymentStatus, isLoading } = useVerifyPaymentQuery(
    { orderId, type: paymentType },
    {
      skip: !orderId || stopPolling || attempts >= MAX_ATTEMPTS,
      pollingInterval: 10000, // Check every 10 sec
    }
  );

  console.log("Payment Status in verification:", paymentStatus);

  const startDownload = (url) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = url.split("/").pop();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setIsDownloaded(true);
  };

  useEffect(() => {
    if (!paymentStatus) return;

    if (attempts >= MAX_ATTEMPTS) {
      setStatus("Verification timeout. Please contact support.");
      setStopPolling(true);
      return;
    }

    if (!stopPolling) {
      setAttempts((prev) => prev + 1);
    }

    switch (paymentStatus.paymentStatus) {
      case "PAID":
        if (!downloadStarted.current) {
          downloadStarted.current = true;
          // Determine which URL to use based on payment type
          const downloadUrl = paymentType === 'question' 
            ? paymentStatus.questionPaperUrl 
            : paymentStatus.answerPaperUrl;
            
          if (downloadUrl) {
            startDownload(downloadUrl);
          } else {
            setStatus(`Error: ${paymentType === 'question' ? 'Question' : 'Answer'} paper URL not found.`);
          }
        }
        setStatus(`Payment verified! Your ${paymentType} paper is downloading.`);
        setStopPolling(true);
        break;

      case "PENDING":
        setStatus("Payment is still being processed. Please wait...");
        break;

      case "FAILED":
        setStatus("Payment failed. Please try again.");
        setStopPolling(true);
        break;

      case "ORDER NOT FOUND":
        setStatus("Invalid order ID. Please check and try again.");
        setStopPolling(true);
        break;

      default:
        setStatus("An unexpected error occurred. Please contact support.");
        setStopPolling(true);
    }
  }, [paymentStatus, attempts, stopPolling, paymentType]);

  const paperTypeLabel = paymentType === 'question' ? 'Question Paper' : 'Answer Paper';

  return (
    <div className="payment-verification">
      <div className="payment-verification__container">
        {isDownloaded ? (
          <FileDownloadDoneIcon className="payment-verification__icon payment-verification__icon--downloaded" />
        ) : isLoading ? (
          <CircularProgress className="payment-verification__icon payment-verification__icon--loading" />
        ) : paymentStatus?.status === "SUCCESS" ? (
          <CheckCircleIcon className="payment-verification__icon payment-verification__icon--success" />
        ) : paymentStatus?.status === "FAILED" ? (
          <ErrorIcon className="payment-verification__icon payment-verification__icon--error" />
        ) : (
          <HourglassEmptyIcon className="payment-verification__icon payment-verification__icon--pending" />
        )}

        <h2 className="payment-verification__status">
          {isDownloaded ? `${paperTypeLabel} Download Complete! Check your files.` : status}
        </h2>

        {paymentStatus?.status === "FAILED" && (
          <button
            onClick={() => window.location.reload()}
            className="payment-verification__retry-button"
          >
            Retry Verification
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentVerification;