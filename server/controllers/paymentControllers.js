import {
    createOrderService,
    updatePaymentService,
    verifyPaymentService,
    handleWebhookService,
  } from '../services/paymentService.js';
  
  export const createOrder = async (req, res) => {
    try {
      const result = await createOrderService(req.body);
      res.json(result);
    } catch (error) {
      res.status(error.response?.status || 500).json({
        error: {
          message: error.response?.data?.message || error.message,
          type: error.response?.data?.type || 'unknown',
          code: error.response?.status || 500,
        },
      });
    }
  };
  
  export const updatePayment = async (req, res) => {

    const { orderId, type } = req.query;

    console.log("Query Parameters:", req.query); // Log the query parameters for debugging

    try {
      const result = await updatePaymentService({ orderId, type });
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  };
  
  export const verifyPayment = async (req, res) => {
    try {
      const { orderId, type } = req.query;

      console.log("Query Parameters:", req.query); 
      
      if (!orderId) {
        return res.status(400).json({ message: "Order ID is required" });
      }
      
      const result = await verifyPaymentService({ orderId, type });
      
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error in verifyPaymentController:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
  
  export const handleWebhook = async (req, res) => {
    try {
      console.log("Webhook Request Body:", req.body); // Log the request body for debugging
      const result = await handleWebhookService(req.body); // Pass req.body to the service

      res.status(200).json(result); // Send the result back to the client
    } catch (error) {
      console.error("Webhook Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };