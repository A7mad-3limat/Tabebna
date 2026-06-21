import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; 
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, getDoc, doc, runTransaction, serverTimestamp, addDoc } from 'firebase/firestore';
import '../styles/DoctorProfile.css';

const DoctorProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [doctorData, setDoctorData] = useState(location.state?.doctorData);
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const doctorId = doctorData?.id;

  useEffect(() => {
    if (doctorId) {
      const fetchLatestDoctorData = async () => {
        try {
          const doctorRef = doc(db, "doctors", doctorId);
          const doctorSnap = await getDoc(doctorRef);

          if (doctorSnap.exists()) {
            setDoctorData((prevDoctorData) => ({
              ...(prevDoctorData || {}),
              id: doctorSnap.id,
              ...doctorSnap.data()
            }));
          }
        } catch (error) {
          console.error("Error fetching latest doctor data:", error);
        }
      };

      const fetchReviews = async () => {
        try {
          const q = query(
            collection(db, "reviews"), 
            where("doctorId", "==", doctorId),
            orderBy("createdAt", "desc")
          );
          const querySnapshot = await getDocs(q);
          setReviews(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
          console.error("Error fetching reviews:", error);
        }
      };
      fetchLatestDoctorData();
      fetchReviews();
    }
  }, [doctorId]);

  const formatReviewDate = (createdAt) => {
    if (!createdAt?.seconds) return 'الآن';
    return new Date(createdAt.seconds * 1000).toLocaleDateString('ar-JO');
  };

  // 🌟 دالة تحديد حالة التقييم واللون (تمت إضافتها هنا) 🌟
  const getRatingStatus = (rating) => {
    const numRating = Number(rating);
    if (numRating >= 4) {
      return { text: 'ممتاز', color: '#00ff3c', bg: '#e8f5e9' }; // أخضر
    } else if (numRating >= 2) {
      return { text: 'جيد', color: '#facc00', bg: '#fff8e1' }; // أصفر/ذهبي
    } else {
      return { text: 'سيء', color: '#ff0000', bg: '#ffebee' }; // أحمر
    }
  };

  if (!doctorData) {
    return (
      <div dir="rtl" className="profile-not-found">
        <h2>عذراً، لم يتم العثور على الطبيب!</h2>
        <button onClick={() => navigate('/')} className="profile-not-found-button">العودة للرئيسية</button>
      </div>
    );
  }

  const renderStars = (rating, fontSize = "18px") => {
    const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));

    return (
      <div style={{ direction: 'ltr', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {Array.from({ length: 5 }).map((_, index) => {
          let fill = 0;
          if (safeRating >= index + 1) fill = 100;
          else if (safeRating > index) fill = (safeRating - index) * 100;

          return (
            <div key={index} style={{ position: 'relative', display: 'inline-block', fontSize }}>
              <span style={{ color: '#e4e5e9', display: 'inline-block' }}>★</span>
              <span style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${fill}%`,
                overflow: 'hidden',
                color: '#ffc107',
                whiteSpace: 'nowrap',
                display: 'inline-block'
              }}>
                ★
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const reviewRef = doc(collection(db, "reviews"));

    try {
      const doctorRef = doc(db, "doctors", doctorData.id);

      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(doctorRef);
        if (!docSnap.exists()) throw new Error("الطبيب غير موجود في قاعدة البيانات!");

        const data = docSnap.data();
        const newTotal = (data.totalRating || 0) + Number(newRating);
        const newCount = (data.reviewCount || 0) + 1;
        const newAverage = Number((newTotal / newCount).toFixed(1));

        transaction.update(doctorRef, { totalRating: newTotal, reviewCount: newCount, rating: newAverage });
        transaction.set(reviewRef, {
          doctorId: doctorData.id,
          rating: Number(newRating),
          comment: newComment.trim() || null,
          createdAt: serverTimestamp()
        });

        setDoctorData({ ...doctorData, rating: newAverage, reviewCount: newCount });
      });

      setReviews([{ id: reviewRef.id, rating: Number(newRating), comment: newComment, createdAt: { seconds: Date.now() / 1000 } }, ...reviews]);
      setNewComment('');
      setShowReviewForm(false);
      alert("تمت إضافة تقييمك بنجاح!");
    } catch (e) {
      alert("حدث خطأ أثناء التقييم.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportReview = async (review) => {
    const confirmed = window.confirm("هل تريد الإبلاغ عن هذا التعليق؟");
    if (!confirmed) return;

    try {
      await addDoc(collection(db, "reports"), {
        doctorId: doctorData.id,
        reviewId: review.id || null,
        commentText: review.comment || null,
        createdAt: serverTimestamp()
      });

      alert("تم إرسال البلاغ بنجاح.");
    } catch (error) {
      console.error("Error reporting review:", error);
      alert("حدث خطأ أثناء إرسال البلاغ.");
    }
  };

  return (
    <div className="profile-page-shell" dir="rtl">
      <div className="profile-back-wrap">
        <button onClick={() => navigate(-1)} className="profile-back-button">
          <span>→</span> عودة للنتائج
        </button>
      </div>

      <div className="doctor-profile-container">
        <div className="profile-sidebar-wrapper">
          <div className="profile-sidebar">
            <img
              src="https://via.placeholder.com/150" 
              alt="doctor" 
              className="profile-doctor-image"
            />
            <h2 className="profile-doctor-name">{doctorData.name}</h2>
            <p className="profile-doctor-specialty">{doctorData.specialty}</p>
            
            <div className="profile-rating-box">
              {renderStars(doctorData.rating, "24px")}
              <div className="profile-rating-value">{Number(doctorData.rating || 0).toFixed(1)}</div>
              <div className="profile-rating-count">({doctorData.reviewCount || 0} تقييم)</div>
            </div>

            <div className="profile-sidebar-actions">
              <button 
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="profile-action-button profile-add-review-button"
              >
                {showReviewForm ? 'إلغاء التقييم' : '+ أضف تقييماً'}
              </button>
              
              <button 
                onClick={() => {
                  if (doctorData.phone) {
                    window.location.href = `tel:${doctorData.phone}`;
                  } else {
                    alert("عذراً، رقم هاتف هذه العيادة غير متوفر حالياً.");
                  }
                }}
                className="profile-action-button profile-contact-button"
              >
                📞 الاتصال بالعيادة
              </button>
            </div>
          </div>
        </div>

        <div className="profile-main-content">
          <div className="info-section clinic-section">
            <h3>العيادات وأماكن العمل</h3>
            <div className="clinic-grid">
              <div className="clinic-location-card">
                <h4>عيادة {doctorData.location}</h4>
                <p>📍 العنوان: {doctorData.city}، {doctorData.street}</p>
                <p>📞 هاتف: {doctorData.phone || 'غير متوفر'}</p>
                <span>[Non-callable]</span>
              </div>
            </div>
          </div>

          <div className="info-section reviews-section">
            <h3>تقييمات المرضى المفصلة</h3>

            {showReviewForm && (
              <div id="review-form" className="review-form-card">
                <h4>شاركنا رأيك بالدكتور:</h4>
                <form onSubmit={handleReviewSubmit}>
                  <div className="range-group">
                    <label>التقييم: ({newRating} نجوم)</label>
                    <input type="range" min="1" max="5" value={newRating} onChange={(e) => setNewRating(e.target.value)} className="rating-range" />
                  </div>
                  <textarea 
                    value={newComment} 
                    onChange={(e) => setNewComment(e.target.value)} 
                    placeholder="اكتب تجربتك مع الدكتور (اختياري)..." 
                    className="review-textarea"
                  />
                  <button type="submit" disabled={isSubmitting} className="submit-review-button">
                    {isSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
                  </button>
                </form>
              </div>
            )}

            <div className="reviews-grid">
              {reviews.length === 0 ? (
                <p className="no-reviews-message">لا توجد مراجعات حالياً. كن أول من يقيّم!</p>
              ) : (
                reviews.map((rev, index) => {
                  const status = getRatingStatus(rev.rating); // 🌟 استدعاء دالة الألوان 🌟
                  const safeRating = Math.max(0, Math.min(5, Math.round(rev.rating || 0)));

                  return (
                    <div key={rev.id || index} className="review-card">
                      <div className="review-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                        
                        {/* 🌟 النجوم وشريط الحالة الملون 🌟 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ color: '#FFD700', fontSize: '1.2rem', letterSpacing: '2px', direction: 'ltr' }}>
                            {'★'.repeat(safeRating)}{'☆'.repeat(5 - safeRating)}
                          </div>
                          
                          <span style={{
                            color: status.color,
                            backgroundColor: status.bg,
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold'
                          }}>
                            {status.text}
                          </span>
                        </div>

                        <span className="review-date" style={{ marginRight: 'auto' }}>
                          {formatReviewDate(rev.createdAt)}
                        </span>
                      </div>
                      
                      <div className="review-content-row" style={{ marginTop: '10px' }}>
                        <p className="review-text" style={{ flex: 1, margin: 0 }}>
                          {rev.comment || 'تقييم بدون تعليق'}
                        </p>
                        <button
                          onClick={() => handleReportReview(rev)}
                          className="report-review-button"
                        >
                          إبلاغ
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;