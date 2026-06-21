import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import Navigation from './Navigation';
import FilterSidebar from './FilterSidebar';
import SearchResults from './SearchResults';
import DoctorProfile from './DoctorProfile';
import AddDoctor from './AddDoctor';
import AdminPanel from './AdminPanel';
import Login from './Login';
import ContactUs from './ContactUs';
import '../styles/App.css';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Home = ({ filters, setFilters, searchQuery, doctorsList, isLoading }) => (
  <div className="main-layout">
    <div className="home-filter-column">
      <FilterSidebar onApplyFilters={setFilters} />
    </div>

    <div className="home-results-column">
      <div className="home-results-header">
        <h2 className="home-results-title">نتائج البحث</h2>

        <Link to="/add-doctor" className="home-add-doctor-link">
          + إضافة طبيب جديد
        </Link>
      </div>

      {isLoading ? (
        <div className="home-loading-state">جاري تحميل الأطباء... ⏳</div>
      ) : (
        <SearchResults doctors={doctorsList} filters={filters} searchQuery={searchQuery} />
      )}
    </div>
  </div>
);

const App = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ specialty: '', location: '' });
  const [allDoctors, setAllDoctors] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "doctors"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const doctors = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAllDoctors(doctors);
      setIsLoading(false);
    }, (error) => {
      console.error("Error loading doctors: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="App" dir="rtl">
        <Navigation onSearch={setSearchQuery} />
        <Routes>
          <Route path="/" element={
            <Home 
              filters={filters} 
              setFilters={setFilters} 
              searchQuery={searchQuery} 
              doctorsList={allDoctors}
              isLoading={isLoading} 
            />
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/doctor-profile" element={<DoctorProfile />} />
          <Route path="/add-doctor" element={<AddDoctor />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/doctor-profile/:id" element={<DoctorProfile />} />
          <Route path="/admin-control-center" element={<AdminPanel />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>

        <ToastContainer 
          position="bottom-left" 
          rtl={true} 
          theme="colored" 
          autoClose={3000} 
        />
      </div>
    </Router>
  );
};

export default App;