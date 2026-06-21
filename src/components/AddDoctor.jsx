import React, { useState } from 'react';
import { db } from '../firebase'; 
import { collection, serverTimestamp, getDocs, query, where, doc, writeBatch } from 'firebase/firestore'; 
import { useNavigate } from 'react-router-dom';
import '../styles/AddDoctor.css';

import { toast } from 'react-toastify';

const AddDoctor = () => {
  const navigate = useNavigate();
  const [doctorData, setDoctorData] = useState({
    name: '',
    specialty: '',
    location: '', 
    city: '',     
    street: '',   
    phone: '',    
    initialRating: 5,
    comment: ''   
  });

  const [isLoading, setIsLoading] = useState(false);

  const specialties = [
    "طب عام", "باطنية", "قلب", "أطفال", "عيون", "عظام", "أسنان", 
    "جلدية", "نسائية وتوليد", "أنف وأذن وحنجرة", "أعصاب", "نفسية", "مسالك بولية", "جراحة عامة"
  ];

  const locations = [
    "عمان", "الزرقاء", "إربد", "البلقاء", "مادبا", "الكرك", 
    "معان", "الطفيلة", "عجلون", "جرش", "المفرق", "العقبة"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDoctorData({ ...doctorData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, specialty, location, city, street } = doctorData;
    if (!name || !specialty || !location || !city || !street) {
      toast.warning("الرجاء تعبئة جميع الخانات الإجبارية!");
      return;
    }

    setIsLoading(true);

    try {
      const q = query(
        collection(db, "doctors"), 
        where("name", "==", doctorData.name.trim()),
        where("specialty", "==", doctorData.specialty)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        toast.error("هذا الطبيب موجود مسبقاً!");
        setIsLoading(false);
        return;
      }

      const batch = writeBatch(db);
      const doctorRef = doc(collection(db, "doctors")); 
      const reviewRef = doc(collection(db, "reviews")); 

      batch.set(doctorRef, {
        name: doctorData.name.trim(),
        specialty: doctorData.specialty,
        location: doctorData.location,
        city: doctorData.city,
        street: doctorData.street,
        phone: doctorData.phone,
        rating: Number(doctorData.initialRating),
        totalRating: Number(doctorData.initialRating), 
        reviewCount: 1,
        createdAt: serverTimestamp() 
      });

      batch.set(reviewRef, {
        doctorId: doctorRef.id,
        rating: Number(doctorData.initialRating),
        comment: doctorData.comment.trim() || null,
        createdAt: serverTimestamp()
      });

      await batch.commit();
      
      toast.success("تم إضافة الطبيب بنجاح!");
      navigate('/'); 
      
    } catch (error) {
      console.error("Error: ", error);
      toast.error('حدث خطأ أثناء الحفظ.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-doctor-container" dir="rtl">
      <div className="add-doctor-shell">
        <button onClick={() => navigate('/')} className="back-to-home-button">
          <span>→</span> عودة للرئيسية
        </button>

        <div className="add-doctor-card">
          <h2>إضافة طبيب جديد</h2>
          <form onSubmit={handleSubmit} className="add-doctor-form">
            
            <div className="form-group">
              <label>اسم الطبيب</label>
              <input type="text" name="name" value={doctorData.name} onChange={handleChange} placeholder="د. محمد ..." required />
            </div>

            <div className="form-group">
              <label>التخصص</label>
              <select name="specialty" value={doctorData.specialty} onChange={handleChange} required>
                <option value="">اختر التخصص...</option>
                {specialties.map((s, index) => <option key={index} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>المحافظة</label>
              <select name="location" value={doctorData.location} onChange={handleChange} required>
                <option value="">اختر المحافظة...</option>
                {locations.map((l, index) => <option key={index} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>المدينة</label>
              <input type="text" name="city" value={doctorData.city} onChange={handleChange} placeholder="المنطقة/المدينة" required />
            </div>

            <div className="form-group full-width">
              <label>الشارع / العنوان التفصيلي</label>
              <input type="text" name="street" value={doctorData.street} onChange={handleChange} placeholder="اسم الشارع، بجانب..." required />
            </div>

            <div className="form-group full-width">
              <label>رقم الهاتف</label>
              <input type="tel" name="phone" value={doctorData.phone} onChange={handleChange} placeholder="07XXXXXXXX (اختياري)" />
            </div>

            <div className="form-group full-width add-doctor-rating-panel">
              <label>تقييمك الأولي: ({doctorData.initialRating} نجوم)</label>
              <input type="range" name="initialRating" min="1" max="5" value={doctorData.initialRating} onChange={handleChange} className="add-doctor-range" />
              
              <label className="add-doctor-comment-label">تعليقك (اختياري):</label>
              <textarea name="comment" value={doctorData.comment} onChange={handleChange} placeholder="اكتب أول مراجعة لهذا الطبيب..." className="add-doctor-comment" rows="2" />
            </div>

            <button type="submit" className="submit-btn full-width" disabled={isLoading}>
              {isLoading ? 'جاري الإضافة...' : 'تأكيد الإضافة'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDoctor;