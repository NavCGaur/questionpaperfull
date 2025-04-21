import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../../../analytics/analytics';
import './header.css';
import ai from '../../../assets/ai.png';
import tickmark from '../../../assets/tickmark.png';
import { useValidatePaperIdQuery } from '../../../state/api';


const Header = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paperId, setPaperId] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const navigate = useNavigate();

  const { data, isFetching, error } = useValidatePaperIdQuery(paperId, {
    skip: paperId.length !== 15,
  });

  useEffect(() => {
    if (data?.isValid) {
      setShowMessage(true);
      setTimeout(() => {
        setShowMessage(false);
        navigate('/payment', { state: { paperId} }); // Pass PaperId as state
      }, 4000);
    }
  }, [data, navigate, paperId]);

  const handlePaperIdChange = (e) => {
    const value = e.target.value;
    setPaperId(value);
  };



  return (
    <div>
      <div className="gpt4__header" id="home">
        <div className='gpt4__header-content'>
          <h1 className='gradient__text'>Unlimited Free Question Papers </h1>
          <div className='gpt4__header-features'>
            <img src={tickmark} alt=''></img>
            <p>Zero Typing.  </p>
          </div>
          <div className='gpt4__header-features'>
            <img src={tickmark} alt=''></img>
            <p>Downloadable in Word Format.  </p>
          </div>
          <div className='gpt4__header-features'>
            <img src={tickmark} alt=''></img>
            <p>Time Saver - Instantly generates question papers.  </p>
          </div>
          <div className='gpt4__header-features'>
            <img src={tickmark} alt=''></img>
            <p>Create Question Paper for Classes 1 to 12, CBSE, All Subjects.  </p>
          </div>
          <div className='gpt4__header-features'>
            <p className='gradient__text'>Our AI powered app Instantly generates high-quality, NEP-aligned question papers. </p>
          </div>
        </div>
        <div className='gpt4__header-image'>
          <div className='gpt4__header-imageContainer'>
            <img src={ai} alt='ai' />
            <div className='gpt4__header-features-cta'>
              <a href='#formatChoser' className="gpt4__cta-button" onClick={() => trackEvent("User", "Clicked Make Your Paper Button", "Make Your Paper Link")}>
                Make Your Paper
              </a>
            </div>
            <div className='gpt4__header-features-cta'>
              <button className="gpt4__cta-button" onClick={() => setIsModalOpen(true)}>
                Get Answer Paper
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <p>Enter the Paper ID mentioned at the top of the Question Paper</p>
            
            <input
              type="text"
              placeholder="Paper ID"
              value={paperId}
              onChange={handlePaperIdChange}
              maxLength="15"
            />
              {isFetching && <p>🔄 Validating...</p>}
              {showMessage && <p>✅ Paper ID validated, going to Payment Page...</p>}
              {error && <p>🔴 Invalid Paper ID. Please enter a valid one.</p>}
            <div className="extra-section">
              <p>Don't have a Question Paper yet?</p>
              <a href="#formatChoser" onClick={() => setIsModalOpen(false)}>Make your Question Paper for Free instantly! -
                 <span style={{fontWeight:"bold", textDecoration:"underline"}} >Click Here</span></a>
            </div>
            <button className="close-button" onClick={() => setIsModalOpen(false)}>Close</button>
          </div>
        </div>
      )}  
    </div>
  );
};

export default Header;