import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, LinearProgress, MenuItem, Select, InputLabel, FormControl, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSelector } from 'react-redux';
import './index.css';


const PaperForm = ({ onClose, generatePaperMutation }) => {

    const [generatePaper, { isLoading }] = generatePaperMutation;

    const eduData = useSelector((state) => state.eduData.data);
    
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
      className: '',
      subject: '',
      difficulty: 'easy',
      numQuestions: '',
      sections: [],
      chapters: [],
    });
    const [numSections, setNumSections] = useState(1);
    const [filePathQuestion, setFilePathQuestion] = useState(null);
    const [filePathAnswer, setFilePathAnswer] = useState(null);
    const [paperId, setPaperId] = useState(null);
    const [buttonStatus, setButtonStatus] = useState('initial');
    
    // State to store all data (classes, subjects, chapters)
    const [allData, setAllData] = useState({
      classes: [], // List of classes
      subjects: {}, // { className: [subjects] }
      chapters: {}, // { className: { subject: [chapters] } }
    });

    // Fetch all data when the component mounts
    useEffect(() => {
      if (eduData) {
        console.log("eduData:", eduData);
        setAllData(eduData);
      }
    }, [eduData]); // Only re-run when eduData changes
  
    const resetForm = () => {
      setFormData({
        className: '',
        subject: '',
        difficulty: 'easy',
        numQuestions: '',
        sections: [],
        chapters: [],
      });
      setNumSections(1);
      setFilePathQuestion(null);
      setFilePathAnswer(null);
      setPaperId(null);
      setButtonStatus('initial');
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      const updatedFormData = { ...formData, totalMarks: totalPaperMarks };
  
      try {
        const result = await generatePaper(updatedFormData).unwrap();
        setPaperId(result.paperId);
        setFilePathQuestion(result.filePathQuestion);
        setFilePathAnswer(result.filePathAnswer);
      } catch (error) {
        console.error('Failed to generate paper:', error);
      }
    };
  
    useEffect(() => {
      if (isLoading) {
        setButtonStatus('loading');
      }
    }, [isLoading]);
  
    const navigateToPayment = (type) => {
      navigate('/payment', { state: { paperId, type } });
    };
  
    const getButtonContent = () => {
      switch (buttonStatus) {
        case 'loading':
          return (!paperId && (
            <div style={{ textAlign: 'center', marginTop: '5px' }}>
              <LinearProgress
                sx={{
                  flexGrow: 1,
                  backgroundColor: 'lightgrey',
                  mb: 1,
                }}
              />
              <p style={{ color: '#000000', margin: 0 }}>
                Your Paper is being generated, please wait.
              </p>
            </div>)
          );
        case 'ready':
          return 'Generate another paper';
        default:
          return 'Generate Paper';
      }
    };
  
    // Handle class change
    const handleClassChange = (e) => {
      const className = e.target.value;
      setFormData({ ...formData, className, subject: '', chapters: [] });
    };

    // Handle subject change
    const handleSubjectChange = (e) => {
      const subject = e.target.value;
      setFormData({ ...formData, subject, chapters: [] });
    };

    // Handle chapters change
    const handleChaptersChange = (e) => {
      const selectedChapters = Array.isArray(e.target.value) ? e.target.value : [];
      setFormData({ ...formData, chapters: selectedChapters });
    };
    
    const handleNumSectionsChange = (e) => {
      const value = parseInt(e.target.value, 10);
      setNumSections(value);
  
      const newSections = Array.from({ length: value }, (_, index) => ({
        sectionName: `Section ${String.fromCharCode(65 + index)}`,
        numQuestions: 0,
        totalMarks: 0,
      }));
      setFormData({ ...formData, sections: newSections });
    };
  
    const handleSectionChange = (index, field, value) => {
      const updatedSections = formData.sections.map((section, i) => {
        if (i === index) {
          const updatedSection = { ...section, [field]: value };
          if (field === 'numQuestions') {
            const questionCount = parseInt(value, 10) || 0;
            updatedSection.markPerQuestion = index + 1;
            updatedSection.totalMarks = questionCount * (index + 1);
          }
          return updatedSection;
        }
        return section;
      });
      setFormData({ ...formData, sections: updatedSections });
    };
  
    const totalQuestions = formData.sections.reduce((sum, section) => sum + parseInt(section.numQuestions || 0, 10), 0);
    const totalPaperMarks = formData.sections.reduce((sum, section) => sum + parseInt(section.totalMarks || 0, 10), 0);
  
    return (
      <div className="container__paperform" style={{ position: 'relative' }}>
        <div className="paperform__header">
          <h3>Fill Paper Details</h3>
          <IconButton
            onClick={onClose}
            aria-label="close"
            className="paperform__close-icon"
            size="large"
            sx={{
              color: 'white',
              '&:hover': {
                color: '#e0e0e0',
              },
              '& .MuiSvgIcon-root': {
                fontSize: '2rem',
              },
              padding: '12px',
            }}
          >
            <CloseIcon />
          </IconButton>
        </div>
  
        <form onSubmit={handleSubmit} className="container__paperform-form">
        <div className="container__paperform-form-group">
          <FormControl fullWidth margin="normal">
            <InputLabel>Class</InputLabel>
            <Select
              name="className"
              value={formData.className}
              onChange={handleClassChange}
              required
              MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
            >
              {allData.classes.map((cls) => (
                <MenuItem key={cls} value={cls}>
                  {cls}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div className="container__paperform-form-group">
          <FormControl fullWidth margin="normal">
            <InputLabel>Subject</InputLabel>
            <Select
              name="subject"
              value={formData.subject}
              onChange={handleSubjectChange}
              required
              MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
            >
              {formData.className &&
                allData.subjects?.[formData.className]?.map((subject, index) => (
                  <MenuItem key={index} value={subject}>
                    {subject}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </div>

        <div className="container__paperform-form-group">
          <FormControl fullWidth margin="normal">
            <InputLabel>Chapters</InputLabel>
            <Select
              name="chapters"
              value={formData.chapters}
              onChange={handleChaptersChange}
              multiple
              required
            >
              {formData.className &&
                formData.subject &&
                allData.chapters?.[formData.className]?.[formData.subject]?.map((chapter, index) => (
                  <MenuItem key={index} value={chapter}
                  sx={{ 
                        '&.Mui-selected': { 
                          backgroundColor: '#C4E4FD',
                        },
                        '&.Mui-selected:hover': { 
                          backgroundColor: '#C4E4FD',
                        },
                     }}>
                    {chapter}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </div>

          <div className="container__paperform-form-group">
            <FormControl fullWidth margin="normal">
              <InputLabel>Number of Sections</InputLabel>
              <Select
                value={numSections}
                onChange={handleNumSectionsChange}
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {i + 1}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
  
          {formData.sections.map((section, index) => (
            <div key={index} className="paperform__form-group">
              <p>{section.sectionName}</p>
              <TextField
                label="No. of Ques"
                type="number"
                value={section.numQuestions}
                onChange={(e) => handleSectionChange(index, 'numQuestions', e.target.value)}
                margin="normal"
                size="small"
                className="small-text-field"
              />
              <p>Marks: {section.totalMarks}</p>
            </div>
          ))}
  
          <div className="container__paperform-form-summary">
            <p>Total Questions: {totalQuestions}</p>
            <p>Total Marks: {totalPaperMarks}</p>
          </div>
  
          <Button
            type={buttonStatus === 'ready' ? 'button' : 'submit'}
            variant="contained"
            color="primary"
            disabled={isLoading}
            fullWidth
            onClick={buttonStatus === 'ready' ? resetForm : undefined}
            sx={{
              backgroundColor: isLoading ? 'white' : undefined,
              color: isLoading ? 'black' : undefined,
              '&:hover': {
                backgroundColor: buttonStatus === 'ready' ? '#1565c0' : undefined
              }
            }}
          >
            {getButtonContent()}
          </Button>
  
          {paperId && (
            <>
              <Button
                type="button"
                variant="contained"
                color="primary"
                disabled={isLoading}
                fullWidth
                onClick={() => navigateToPayment('question')}
                sx={{
                  backgroundColor: isLoading ? 'white' : '#4CAF50',
                  color: isLoading ? 'black' : undefined,
                  mt: '1rem',
                  '&:hover': {
                    backgroundColor: '#45a049'
                  }
                }}
              >
                Download Question Paper - (₹2)
              </Button>

              <Button
                type="button"
                variant="contained"
                color="primary"
                disabled={isLoading}
                fullWidth
                onClick={() => navigateToPayment('answer')}
                sx={{
                  backgroundColor: isLoading ? 'white' : '#FF4820',
                  color: isLoading ? 'black' : undefined,
                  mt: '1rem',
                  '&:hover': {
                    backgroundColor: '#e53935'
                  }
                }}
              >
                Download Answer Paper - (₹5)
              </Button>
            </>
          )}
        </form>
      </div>
    );
  };
  
  export default PaperForm;