// App.js
import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './container/navigation/navbar/Navbar'; 
import Header from './container/navigation/header/Header';
import FormatChoser from './container/questionPaper/formatChoser'; 
import Footer from './container/navigation/footer/Footer';
import ContactUs from './components/contactUs/ContactUs'; 
import TermsAndConditions from './components/contactUs/ContactUs'; 
import RefundAndCancellation from './components/refundAndCancellation/RefundAndCancellation'; 
import { trackPageView } from './analytics/analytics';
import Payment from './container/questionPaper/payment/Payment';
import PaymentVerification from './container/questionPaper/payment/PaymentVerification';
import ChatbotWidget from "./container/chatbot/ChatbotWidget";
import ChatbotUI from "./container/chatbot/ChatbotUI";
//import PaperInterfaceBilingual from './container/paperInterfaceBilingual';
//import { QuestionMarkTwoTone } from '@mui/icons-material';
import QuestionSummaryDashboard from './container/questionPaper/QuestionSummary';
import { useFetchEduDataQuery } from './state/api'; // Update the import path
import { useDispatch } from 'react-redux';
import { setEduData } from './state/eduSlice'; // You'll need to create this slice

function App() {
  const dispatch = useDispatch();
  const { data: eduData, isLoading, isError } = useFetchEduDataQuery();

  useEffect(() => {
    trackPageView();
  }, []);

  useEffect(() => {
    if (eduData) {
      dispatch(setEduData(eduData));
    }
  }, [eduData, dispatch]);


  return (
    <Router>
      <div className='gradient__bg'>
          <Navbar />
          <Routes>
            <Route path='/' element={
              <>
                <Header />
                <FormatChoser />
                <ChatbotWidget />
                <ChatbotUI />
              </>
            } />
          <Route path='/footer' element={<Footer />} />
          <Route path='/Payment' element={<Payment />} />
          <Route path='/payment-status' element={<PaymentVerification />} />
          <Route path='/ContactUs' element={<ContactUs />} />
          <Route path='/termsandconditions' element={<TermsAndConditions />} />
          <Route path='/refundandcancellation' element={<RefundAndCancellation />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
