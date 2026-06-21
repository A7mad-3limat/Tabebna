import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DoctorCard from './DoctorCard';
import '../styles/SearchResults.css';

const SearchResults = ({ doctors, filters, searchQuery }) => {
  const [sortBy, setSortBy] = useState('rating');

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      const matchSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSpecialty = filters.specialty ? doc.specialty === filters.specialty : true;
      const matchLocation = filters.location ? doc.location === filters.location : true;
      
      return matchSearch && matchSpecialty && matchLocation;
    }).sort((a, b) => {
  if (sortBy === 'lowestRating') {
    // الترتيب من الأقل إلى الأعلى (تصاعدي)
    return (a.rating || 0) - (b.rating || 0);
  }
  // الترتيب الافتراضي: الأعلى تقييماً (تنازلي)
  return (b.rating || 0) - (a.rating || 0);
});
  }, [doctors, filters, searchQuery, sortBy]);

 
  if (filteredDoctors.length === 0) {
    return (
      <div className="search-results">
        <div className="no-results-box">
          <h3> لم نتمكن من العثور على طبيب يطابق بحثك 😕 </h3>
          <p> هل الطبيب الذي تبحث عنه غير موجود في منصتنا؟ يمكنك إضافته الآن لمساعدة الآخرين. </p>
          <Link to="/add-doctor" className="add-doctor-fallback-btn">
            إضافة طبيب جديد ➕
          </Link>
        </div>
      </div>
    );
  }

  // إذا لقى دكاترة، بيعرضهم طبيعي بدون زر الإضافة
  return (
    <div className="search-results">
      <div className="results-header">
        <h2>النتائج ({filteredDoctors.length})</h2>
        <select onChange={(e) => setSortBy(e.target.value)} value={sortBy}>
  <option value="rating">الأعلى تقييماً</option>
  <option value="lowestRating">الأقل تقييماً</option>
</select>
      </div>
      <div className="doctors-grid">
        {filteredDoctors.map(doctor => (
          <DoctorCard key={doctor.id} doctor={doctor} />
        ))}
      </div>
    </div>
  );
};

export default SearchResults;