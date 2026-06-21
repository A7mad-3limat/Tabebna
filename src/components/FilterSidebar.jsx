import React, { useState } from 'react';

const FilterSidebar = ({ onApplyFilters }) => {
  const [localFilters, setLocalFilters] = useState({ specialty: '', location: '' });

  // كل التخصصات
  const specialties = [
    "طب عام", "باطنية", "قلب", "أطفال", "عيون", "عظام", "أسنان", 
    "جلدية", "نسائية وتوليد", "أنف وأذن وحنجرة", "أعصاب", "نفسية", "مسالك بولية", "جراحة عامة"
  ];

  // كل محافظات الأردن
  const locations = [
    "عمان", "الزرقاء", "إربد", "البلقاء", "مادبا", "الكرك", 
    "معان", "الطفيلة", "عجلون", "جرش", "المفرق", "العقبة"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFilters = { ...localFilters, [name]: value };
    setLocalFilters(updatedFilters);
    onApplyFilters(updatedFilters);
  };

  return (
    <div className="filter-sidebar">
      <h3 className="filter-heading">خيارات التصفية</h3>

      <div className="filter-group">
        <label>التخصص</label>
        <select name="specialty" value={localFilters.specialty} onChange={handleChange} className="filter-select">
          <option value="">الكل</option>
          {specialties.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="filter-group">
        <label>الموقع</label>
        <select name="location" value={localFilters.location} onChange={handleChange} className="filter-select">
          <option value="">الكل</option>
          {locations.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
    </div>
  );
};

export default FilterSidebar;