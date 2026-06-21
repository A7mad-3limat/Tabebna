import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import '../styles/AdminPanel.css'; 

const AdminPanel = () => {
  const [doctors, setDoctors] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reports, setReports] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', specialty: '', location: '', phone: '' });

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDoctorForm, setNewDoctorForm] = useState({ name: '', specialty: '', location: '', phone: '' });

  const [showAddAdminForm, setShowAddAdminForm] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    const doctorsQuery = query(collection(db, "doctors"), orderBy("createdAt", "desc"));
    const reviewsQuery = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const reportsQuery = query(collection(db, "reports"), orderBy("createdAt", "desc"));
    const adminsCollection = collection(db, "admins");

    const unsubscribeDoctors = onSnapshot(doctorsQuery, (snapshot) => {
      setDoctors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });

    const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeAdmins = onSnapshot(adminsCollection, (snapshot) => {
      setAdmins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeDoctors();
      unsubscribeReviews();
      unsubscribeReports();
      unsubscribeAdmins();
    };
  }, []);

  const startEdit = (doctor) => {
    setEditingDoctor(doctor.id);
    setEditForm({ name: doctor.name, specialty: doctor.specialty, location: doctor.location || '', phone: doctor.phone || '' });
  };

  const handleUpdateDoctor = async (id) => {
    try {
      const doctorRef = doc(db, "doctors", id);
      await updateDoc(doctorRef, editForm);
      setEditingDoctor(null);
      alert("تم تحديث بيانات الطبيب بنجاح! ✅");
    } catch (error) {
      alert("حدث خطأ أثناء التحديث ❌");
    }
  };

  const handleDeleteReview = async (review) => {
    if (window.confirm("هل أنت متأكد من حذف هذا التقييم؟")) {
      try {
        const transactionResult = await runTransaction(db, async (transaction) => {
          const reviewRef = doc(db, "reviews", review.id);
          const reviewSnap = await transaction.get(reviewRef);

          if (!reviewSnap.exists()) {
            throw new Error("REVIEW_NOT_FOUND");
          }

          const reviewData = reviewSnap.data();
          const doctorId = reviewData.doctorId;
          const reviewRating = Number(reviewData.rating) || 0;

          if (!doctorId) {
            throw new Error("DOCTOR_ID_MISSING");
          }

          const doctorRef = doc(db, "doctors", doctorId);
          const doctorSnap = await transaction.get(doctorRef);

          if (!doctorSnap.exists()) {
            throw new Error("DOCTOR_NOT_FOUND");
          }

          const doctorData = doctorSnap.data();
          const currentReviewCount = Number(doctorData.reviewCount) || 0;
          const currentTotalRating = Number(doctorData.totalRating) || 0;

          const nextReviewCount = Math.max(0, currentReviewCount - 1);
          const calculatedTotalRating = currentTotalRating - reviewRating;
          const nextTotalRating = nextReviewCount === 0 ? 0 : Math.max(0, calculatedTotalRating);
          const nextRating = nextReviewCount === 0
            ? 0
            : Number((nextTotalRating / nextReviewCount).toFixed(1));

          transaction.update(doctorRef, {
            reviewCount: nextReviewCount,
            totalRating: nextTotalRating,
            rating: nextRating
          });

          transaction.delete(reviewRef);

          return {
            doctorId,
            nextReviewCount,
            nextTotalRating,
            nextRating
          };
        });

        setReviews((prevReviews) => prevReviews.filter((item) => item.id !== review.id));
        setDoctors((prevDoctors) => prevDoctors.map((doctor) => {
          if (doctor.id !== transactionResult.doctorId) {
            return doctor;
          }

          return {
            ...doctor,
            reviewCount: transactionResult.nextReviewCount,
            totalRating: transactionResult.nextTotalRating,
            rating: transactionResult.nextRating
          };
        }));

        alert("تم الحذف بنجاح! ✅");
      } catch (error) {
        console.error("Error deleting review in transaction:", error);
        alert("حدث خطأ أثناء الحذف ❌");
      }
    }
  };

  const handleDeleteDoctor = async (id, name) => {
    if (window.confirm('هل أنت متأكد من حذف الطبيب ' + name + '؟')) {
      try {
        await deleteDoc(doc(db, "doctors", id));
        alert("تم الحذف بنجاح! ✅");
      } catch (error) {
        alert("حدث خطأ أثناء الحذف ❌");
      }
    }
  };

  const handleDeleteReportedReview = async (report) => {
    if (!report.reviewId) {
      alert("لا يمكن حذف التعليق لأن معرف التقييم غير متوفر.");
      return;
    }

    if (!window.confirm("هل أنت متأكد من حذف هذا التعليق والبلاغ المرتبط به؟")) {
      return;
    }

    try {
      const transactionResult = await runTransaction(db, async (transaction) => {
        const reviewRef = doc(db, "reviews", report.reviewId);
        const reportRef = doc(db, "reports", report.id);

        const reviewSnap = await transaction.get(reviewRef);
        const reportSnap = await transaction.get(reportRef);

        if (!reportSnap.exists()) {
          throw new Error("REPORT_NOT_FOUND");
        }

        if (!reviewSnap.exists()) {
          throw new Error("REVIEW_NOT_FOUND");
        }

        const reviewData = reviewSnap.data();
        const doctorId = reviewData.doctorId;
        const reviewRating = Number(reviewData.rating) || 0;

        if (!doctorId) {
          throw new Error("DOCTOR_ID_MISSING");
        }

        const doctorRef = doc(db, "doctors", doctorId);
        const doctorSnap = await transaction.get(doctorRef);

        if (!doctorSnap.exists()) {
          throw new Error("DOCTOR_NOT_FOUND");
        }

        const doctorData = doctorSnap.data();
        const currentReviewCount = Number(doctorData.reviewCount) || 0;
        const currentTotalRating = Number(doctorData.totalRating) || 0;

        const nextReviewCount = Math.max(0, currentReviewCount - 1);
        const calculatedTotalRating = currentTotalRating - reviewRating;
        const nextTotalRating = nextReviewCount === 0 ? 0 : Math.max(0, calculatedTotalRating);
        const nextRating = nextReviewCount === 0
          ? 0
          : Number((nextTotalRating / nextReviewCount).toFixed(1));

        transaction.update(doctorRef, {
          reviewCount: nextReviewCount,
          totalRating: nextTotalRating,
          rating: nextRating
        });

        transaction.delete(reviewRef);
        transaction.delete(reportRef);

        return {
          doctorId,
          reviewId: report.reviewId,
          reportId: report.id,
          nextReviewCount,
          nextTotalRating,
          nextRating
        };
      });

      console.log("Deleted review document:", transactionResult.reviewId);
      console.log("Deleted report document:", transactionResult.reportId);

      setReviews((prevReviews) => prevReviews.filter((item) => item.id !== transactionResult.reviewId));
      setReports((prevReports) => prevReports.filter((item) => item.id !== transactionResult.reportId));
      setDoctors((prevDoctors) => prevDoctors.map((doctor) => {
        if (doctor.id !== transactionResult.doctorId) {
          return doctor;
        }

        return {
          ...doctor,
          reviewCount: transactionResult.nextReviewCount,
          totalRating: transactionResult.nextTotalRating,
          rating: transactionResult.nextRating
        };
      }));

      alert("تم حذف التعليق والبلاغ بنجاح! ✅");
    } catch (error) {
      console.error("Error deleting reported review:", error);
      alert("حدث خطأ أثناء الحذف ❌");
    }
  };

  const handleKeepReportedComment = async (reportId) => {
    if (!window.confirm("هل تريد إبقاء التعليق وحذف البلاغ فقط؟")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "reports", reportId));
      alert("تم حذف البلاغ والإبقاء على التعليق ✅");
    } catch (error) {
      alert("حدث خطأ أثناء حذف البلاغ ❌");
    }
  };

  const handleAddDoctor = async () => {
    if (!newDoctorForm.name || !newDoctorForm.specialty || !newDoctorForm.location || !newDoctorForm.phone) {
      alert("يرجى تعبئة كافة الحقول المطلوبة");
      return;
    }
    try {
      await addDoc(collection(db, "doctors"), {
        ...newDoctorForm,
        createdAt: serverTimestamp(),
        rating: 0,
        reviewCount: 0
      });
      setNewDoctorForm({ name: '', specialty: '', location: '', phone: '' });
      setShowAddForm(false);
      alert("تم إضافة الطبيب بنجاح! ✅");
    } catch (error) {
      alert("حدث خطأ أثناء الإضافة ❌");
    }
  };

  const handleAddAdmin = async () => {
    const name = newAdminForm.name.trim();
    const email = newAdminForm.email.trim().toLowerCase();
    const password = newAdminForm.password;

    if (!name || !email || !password) {
      alert("يرجى تعبئة الاسم والبريد الإلكتروني وكلمة المرور");
      return;
    }

    const duplicateEmail = admins.some((admin) => (admin.email || '').toLowerCase() === email);
    if (duplicateEmail) {
      alert("هذا البريد الإلكتروني مسجل مسبقاً لمسؤول آخر.");
      return;
    }

    try {
      await addDoc(collection(db, "admins"), {
        name,
        email,
        password,
        createdAt: serverTimestamp()
      });
      setNewAdminForm({ name: '', email: '', password: '' });
      setShowAddAdminForm(false);
      alert("تمت إضافة المسؤول بنجاح ✅");
    } catch (error) {
      alert("حدث خطأ أثناء إضافة المسؤول ❌");
    }
  };

  const handleDeleteAdmin = async (adminId, adminName) => {
    if (!window.confirm('هل أنت متأكد من حذف المسؤول ' + (adminName || '') + '؟')) {
      return;
    }

    try {
      await deleteDoc(doc(db, "admins", adminId));
      alert("تم حذف المسؤول بنجاح ✅");
    } catch (error) {
      alert("حدث خطأ أثناء حذف المسؤول ❌");
    }
  };

  const renderRatingStars = (rating) => {
    const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));

    return (
      <div dir="ltr" className="rating-inline-wrap">
        <div className="rating-stars-wrap" dir="ltr">
          {Array.from({ length: 5 }).map((_, index) => {
            let fill = 0;
            if (safeRating >= index + 1) {
              fill = 100;
            } else if (safeRating > index) {
              fill = (safeRating - index) * 100;
            }

            return (
              <span key={index} className="rating-star-slot">
                <span className="rating-star-base">★</span>
                <span
                  className="rating-star-fill"
                  style={{
                    width: String(fill) + '%'
                  }}
                >
                  <span className="rating-star-gold">★</span>
                </span>
              </span>
            );
          })}
        </div>
        <span className="rating-number">
          {Number(safeRating).toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div className="admin-panel-container">
      <div className="admin-layout">
        <div className="admin-sidebar">
          <h2>لوحة التحكم</h2>
          <ul className="sidebar-menu">
            <li><button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>📊 لوحة المعلومات</button></li>
            <li><button className={activeTab === 'doctors' ? 'active' : ''} onClick={() => setActiveTab('doctors')}>👨‍⚕️ إدارة الأطباء</button></li>
            <li><button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')}>⭐ إدارة التقييمات</button></li>
            <li>
              <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>
                🚩 التبليغات
                {reports.length > 0 && (
                  <span className="reports-badge">
                    {reports.length}
                  </span>
                )}
              </button>
            </li>
            <li><button className={activeTab === 'admins' ? 'active' : ''} onClick={() => setActiveTab('admins')}>🛡️ إدارة المسؤولين</button></li>
          </ul>
        </div>

        {isLoading ? (
          <div className="admin-content">
            <div className="admin-loading-state">
              <h2>جاري تحميل البيانات... ⏳</h2>
            </div>
          </div>
        ) : activeTab === 'dashboard' ? (
          <div className="admin-content">
            <div className="admin-header">
              <h1>لوحة المعلومات</h1>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👨‍⚕️</div>
                <h3>إجمالي الأطباء</h3>
                <p className="stat-number">{doctors.length}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <h3>إجمالي التقييمات</h3>
                <p className="stat-number">{reviews.length}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <h3>إجمالي المشرفين</h3>
                <p className="stat-number">{admins.length}</p>
              </div>
            </div>

            <h2>الأطباء المضافين مؤخراً</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>اسم الطبيب</th>
                  <th>التخصص</th>
                  <th>التقييم</th>
                  <th>عدد التقييمات</th>
                  <th>تاريخ الإضافة</th>
                </tr>
              </thead>
              <tbody>
                {doctors.slice(0, 5).map(doctor => (
                  <tr key={doctor.id}>
                    <td>{doctor.name}</td>
                    <td>{doctor.specialty}</td>
                    <td>{renderRatingStars(doctor.rating || 0)}</td>
                    <td>{doctor.reviewCount || 0}</td>
                    <td>{doctor.createdAt ? new Date(doctor.createdAt.toDate()).toLocaleDateString('ar') : 'غير محدد'}</td>
                  </tr>
                ))}
                {doctors.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      <h3>لا يوجد أطباء مضافين حالياً.</h3>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'doctors' ? (
          <div className="admin-content">
            <div className="admin-header">
              <h1>إدارة الأطباء</h1>
              <div className="admin-header-actions">
                <button className="add-doctor-btn" onClick={() => setShowAddForm(!showAddForm)}>+ إضافة طبيب جديد</button>
              </div>
            </div>

            {showAddForm && (
              <>
                <h3 className="admin-add-title">إضافة طبيب جديد</h3>
                <div className="add-doctor-form">
                  <input type="text" placeholder="الاسم *" value={newDoctorForm.name} onChange={(e) => setNewDoctorForm({...newDoctorForm, name: e.target.value})} required />
                  <input type="text" placeholder="التخصص *" value={newDoctorForm.specialty} onChange={(e) => setNewDoctorForm({...newDoctorForm, specialty: e.target.value})} required />
                  <input type="text" placeholder="الموقع * " value={newDoctorForm.location} onChange={(e) => setNewDoctorForm({...newDoctorForm, location: e.target.value})} required />
                  <input type="text" placeholder="الهاتف * " value={newDoctorForm.phone} onChange={(e) => setNewDoctorForm({...newDoctorForm, phone: e.target.value})} required />
                  <button onClick={handleAddDoctor} className="submit-add-btn">إضافة</button>
                  <button onClick={() => setShowAddForm(false)} className="btn-cancel">إلغاء</button>
                </div>
              </>
            )}

            <table className="admin-table">
              <thead>
                <tr>
                  <th>اسم الطبيب</th>
                  <th>التخصص</th>
                  <th>الموقع</th>
                  <th>الهاتف</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map(doctor => (
                  <tr key={doctor.id}>
                    {editingDoctor === doctor.id ? (
                      <>
                        <td><input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="edit-input" /></td>
                        <td><input type="text" value={editForm.specialty} onChange={(e) => setEditForm({...editForm, specialty: e.target.value})} className="edit-input" /></td>
                        <td><input type="text" value={editForm.location} onChange={(e) => setEditForm({...editForm, location: e.target.value})} className="edit-input" /></td>
                        <td><input type="text" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="edit-input" /></td>
                        <td>
                          <button onClick={() => handleUpdateDoctor(doctor.id)} className="btn-save">حفظ</button>
                          <button onClick={() => setEditingDoctor(null)} className="btn-cancel">إلغاء</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{doctor.name}</td>
                        <td>{doctor.specialty}</td>
                        <td>{doctor.location || 'غير محدد'}</td>
                        <td>{doctor.phone || 'غير محدد'}</td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => startEdit(doctor)} className="btn-edit">تعديل</button>
                            <button onClick={() => handleDeleteDoctor(doctor.id, doctor.name)} className="btn-delete">حذف</button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {doctors.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      <h3>لا يوجد أطباء.</h3>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'reviews' ? (
          <div className="admin-content">
            <div className="admin-header">
              <h1>إدارة التقييمات</h1>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>اسم الطبيب</th>
                  <th>التقييم</th>
                  <th>التعليق</th>
                  <th>تاريخ التقييم</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(review => {
                  const doctor = doctors.find(d => d.id === review.doctorId);
                  return (
                    <tr key={review.id}>
                      <td>{doctor ? doctor.name : 'غير محدد'}</td>
                      <td>{renderRatingStars(review.rating || 0)}</td>
                      <td>{review.comment || 'لا يوجد تعليق'}</td>
                      <td>{review.createdAt ? new Date(review.createdAt.toDate()).toLocaleDateString('ar') : 'غير محدد'}</td>
                      <td><button onClick={() => handleDeleteReview(review)} className="btn-delete">حذف</button></td>
                    </tr>
                  );
                })}
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      <h3>لا توجد تقييمات.</h3>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'reports' ? (
          <div className="admin-content">
            <div className="admin-header">
              <h1>التبليغات</h1>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>اسم الطبيب</th>
                  <th>التعليق المُبلّغ عنه</th>
                  <th>معرف التقييم</th>
                  <th>تاريخ البلاغ</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => {
                  const doctor = doctors.find(d => d.id === report.doctorId);
                  return (
                    <tr key={report.id}>
                      <td>{doctor ? doctor.name : 'غير محدد'}</td>
                      <td>{report.commentText || 'تعليق غير متوفر'}</td>
                      <td>{report.reviewId || 'غير متوفر'}</td>
                      <td>{report.createdAt ? new Date(report.createdAt.toDate()).toLocaleDateString('ar') : 'غير محدد'}</td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={() => handleDeleteReportedReview(report)} className="btn-delete">
                            حذف التعليق
                          </button>
                          <button onClick={() => handleKeepReportedComment(report.id)} className="btn-keep">
                            إبقاء التعليق
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      <h3>لا توجد تبليغات حالياً.</h3>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'admins' ? (
          <div className="admin-content">
            <div className="admin-header">
              <h1>إدارة المسؤولين</h1>
              <div className="admin-header-actions">
                <button className="add-doctor-btn" onClick={() => setShowAddAdminForm(!showAddAdminForm)}>إضافة مسؤول جديد</button>
              </div>
            </div>

            {showAddAdminForm && (
              <>
                <h3 className="admin-add-title">إضافة مسؤول جديد</h3>
                <div className="add-doctor-form admin-form-grid">
                  <input
                    type="text"
                    placeholder="الاسم"
                    value={newAdminForm.name}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                    required
                  />
                  <input
                    type="email"
                    placeholder="البريد الإلكتروني"
                    value={newAdminForm.email}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                    required
                  />
                  <input
                    type="password"
                    placeholder="كلمة المرور"
                    value={newAdminForm.password}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                    required
                  />
                  <button onClick={handleAddAdmin} className="submit-add-btn">حفظ المسؤول</button>
                  <button onClick={() => setShowAddAdminForm(false)} className="btn-cancel">إلغاء</button>
                </div>
              </>
            )}

            <table className="admin-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>البريد الإلكتروني</th>
                  <th>تاريخ الإضافة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td>{admin.name || 'غير محدد'}</td>
                    <td>{admin.email || 'غير محدد'}</td>
                    <td>{admin.createdAt?.toDate ? admin.createdAt.toDate().toLocaleDateString('ar') : 'غير محدد'}</td>
                    <td>
                      <button onClick={() => handleDeleteAdmin(admin.id, admin.name)} className="btn-delete">حذف مسؤول</button>
                    </td>
                  </tr>
                ))}

                {admins.length === 0 && (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      <h3>لا يوجد مسؤولون حالياً.</h3>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminPanel;