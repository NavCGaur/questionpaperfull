import Paper from '../models/PaperSchema.js';
import axios from 'axios';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const RETURN_URL = process.env.RETURN_URL;
const NOTIFY_URL = process.env.NOTIFY_URL;
const CASHFREE_BASE_URL = process.env.CASHFREE_BASE_URL 

export const createOrderService = async (body) => {

     
  console.log("Received body:", body);
    const paperId= body.paperId;
    const amount= body.amount;

  
    try {
  
      const paper = await Paper.findOne({ paperId: paperId });
      if (!paper) return { message: "Paper not found" };
  
      // Generate a unique order ID
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      const orderPayload = {
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: `guest_${Date.now()}`,
          customer_email: "guest@example.com",
          customer_phone: "9999999999" 
          
        },
        order_meta: {
          return_url: `${RETURN_URL}?order_id={order_id}`, // URL encode if needed
          notify_url: NOTIFY_URL
        },
        order_note: "Payment for ExamAi", // Optional but recommended
        order_tags: {              // Optional
          type: "AnswerPaper"
        }
      };
  
  
  
      // Make sure your environment variables are properly set
      if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
        throw new Error('Missing Cashfree credentials');
      }
  
      const response = await axios({
        method: 'post',
        url: `${CASHFREE_BASE_URL}/orders`,
        headers: {
          'accept': 'application/json',
          'x-api-version': '2022-09-01',
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'content-type': 'application/json'
        },
        data: orderPayload
      });
  
      const { order_id } = response.data;
  
      paper.orderId = order_id;
      paper.paymentStatus = "PENDING"; // Mark as pending
      await paper.save();
  
      // Send only necessary data to frontend
      return{
        paperId,
        order_id: response.data.order_id,
        order_status: response.data.order_status,
        order_token: response.data.order_token,
        payment_session_id: response.data.payment_session_id
      };
  
    } catch (error) {
      console.error('Detailed error:', error.response?.data || error.message);
      
      // Send a more detailed error response
      return {
          message: error.response?.data?.message || error.message,
          type: error.response?.data?.type || 'unknown',
          code: error.response?.status || 500
        };
    }};

    export const updatePaymentService = async ({ orderId, type }) => {
      try {
        // Validate orderId
        if (!orderId) {
          return { 
            success: false, 
            message: "Order ID is required" 
          };
        }
    
        // Check if paper exists
        const paper = await Paper.findOne({ orderId });
        if (!paper) {
          return { 
            success: false, 
            message: "Paper not found" 
          };
        }
    
        // Check if already paid
        if (paper.paymentStatus === "PAID") {
          return {
            success: true,
            message: "Payment already processed",
            paymentStatus: "PAID",
            questionPaperUrl: paper.questionPaperUrl,
            answerPaperUrl: paper.answerPaperUrl
          };
        }
    
        // Call Cashfree Payments API
        const response = await axios.get(
          `${CASHFREE_BASE_URL}/orders/${orderId}/payments`,
          {
            headers: {
              "x-client-id": CASHFREE_APP_ID,
              "x-client-secret": CASHFREE_SECRET_KEY,
              "x-api-version": "2023-08-01"
            }
          }
        );
    
        // Get the latest payment from the payments array
        const latestPayment = response.data[0];
        
        if (!latestPayment) {
          return {
            success: false,
            message: "No payment found",
            paymentStatus: "PENDING"
          };
        }
    
        // Check payment status
        if (latestPayment.payment_status === "SUCCESS") {
          // Update paper in database
          const updatedPaper = await Paper.findOneAndUpdate(
            { orderId },
            {
              paymentStatus: "PAID",
              orderStatus: "SUCCESS",
            },
            { new: true }
          );
    
          return {
            success: true,
            message: "Payment successful",
            paymentStatus: "PAID",
            questionPaperUrl: updatedPaper.questionPaperUrl,
            answerPaperUrl: updatedPaper.answerPaperUrl
          };
        }
    
        // If payment is not successful
        return {
          success: false,
          message: latestPayment.payment_message || "Payment pending or failed",
          paymentStatus: latestPayment.payment_status
        };
    
      } catch (error) {
        console.error("Error fetching payment status:", error.response?.data || error.message);
        
        // Handle specific API errors
        if (error.response) {
          return {
            success: false,
            message: "Error checking payment status",
            error: error.response.data
          };
        }
    
        // Generic error
        return {
          success: false,
          message: "Internal Server Error",
          error: error.message
        };
      }
    };
    
    export const verifyPaymentService = async ({ orderId, type }) => {
      try {
        // Get order details from the database
        const paper = await Paper.findOne({ orderId });
    
        if (!paper) {
          return {
            status: 'FAILED',
            message: 'Order not found'
          };
        }
    
        // Payment still pending
        if (paper.paymentStatus === "PENDING") {
          return {
            status: "PENDING",
            message: "Your payment is still processing. Please wait."
          };
        }
    
        // Payment successful, return appropriate paper URL
        if (paper.paymentStatus === 'PAID') {
          return {
            status: 'SUCCESS',
            questionPaperUrl: paper.questionPaperUrl,
            answerPaperUrl: paper.answerPaperUrl,
            message: `Payment verified successfully! You can now download your ${type === 'question' ? 'question' : 'answer'} paper.`
          };
        }
    
        // Handle unexpected status
        return {
          status: 'FAILED',
          message: 'Invalid payment status. Please contact support.'
        };
    
      } catch (error) {
        console.error('Payment verification error:', error);
        return {
          status: 'FAILED',
          message: 'Internal server error. Please try again later.'
        };
      }
    };
    
    export const initiatePaymentService = async ({ paperId, currency, type }) => {
      try {
        // Validate input
        if (!paperId) {
          return {
            success: false,
            message: "Paper ID is required"
          };
        }
    
        // Find paper in the database
        const paper = await Paper.findOne({ paperId });
        if (!paper) {
          return {
            success: false,
            message: "Paper not found"
          };
        }
    
        
        // Create a unique order ID
        const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        // Create order with Cashfree
        const orderPayload = {
          order_id: orderId,
          order_amount: amount,
          order_currency: currency || "INR",
          customer_details: {
            customer_id: `cust_${Date.now()}`,
            customer_email: "customer@example.com",
            customer_phone: "9999999999"
          },
          order_meta: {
            return_url: `${process.env.FRONTEND_URL}/payment-verification?order_id=${orderId}&type=${type}`,
            notify_url: `${process.env.BACKEND_URL}/api/payments/cashfree-webhook`
          }
        };
    
        const response = await axios.post(
          `${CASHFREE_BASE_URL}/orders`,
          orderPayload,
          {
            headers: {
              "x-client-id": CASHFREE_APP_ID,
              "x-client-secret": CASHFREE_SECRET_KEY,
              "x-api-version": "2023-08-01"
            }
          }
        );
    
        // Update the paper with order details
        await Paper.findOneAndUpdate(
          { paperId },
          { 
            orderId,
            paymentSessionId: response.data.payment_session_id
          }
        );
    
        return {
          success: true,
          order_id: orderId,
          payment_session_id: response.data.payment_session_id
        };
    
      } catch (error) {
        console.error("Error initiating payment:", error);
        return {
          success: false,
          message: "Failed to initiate payment",
          error: error.message
        };
      }
    };
    
    export const handleWebhookService = async (webhookData) => {
      try {
        // Validate Event Type
        if (webhookData.type !== "PAYMENT_SUCCESS_WEBHOOK") {
          return { message: "Invalid event type" };
        }
    
        const order_id = webhookData.data.order.order_id;
        const payment_status = webhookData.data.payment.payment_status;
    
        if (payment_status !== "SUCCESS") {
          return { message: "Payment not successful" };
        }
    
        // Find Paper by order_id
        const paper = await Paper.findOne({ orderId: order_id });
        
        if (!paper) {
          return { message: "Paper not found" };
        }
    
        // Check if payment status is already updated
        if (paper.paymentStatus === "PAID") {
          return {
            message: "Payment status already updated",
            paymentStatus: "paid",
            questionPaperUrl: paper.questionPaperUrl,
            answerPaperUrl: paper.answerPaperUrl
          };
        }
    
        // Update payment status in MongoDB
        paper.paymentStatus = "PAID";
        paper.orderStatus = "SUCCESS";      
        await paper.save();
        
        return {
          message: "Payment status updated successfully"
        };
      } catch (error) {
        console.error("Error in handleWebhookService:", error);
        throw error; 
      }
    };