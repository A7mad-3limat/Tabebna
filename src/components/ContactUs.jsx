import React from 'react';
import '../styles/ContactUs.css';

const ContactUs = () => {
  return (
    <div className="contact-us-page" dir="rtl">
      <div className="contact-us-card">
        <h2 className="contact-us-title">تواصل معنا</h2>
        
        <form className="contact-us-form">
          <label htmlFor="name">الاسم الكامل</label>
          <input type="text" id="name" placeholder="ادخل اسمك هنا..." />

          <label htmlFor="email">البريد الإلكتروني</label>
          <input type="email" id="email" placeholder="you@example.com" />

          <label htmlFor="message">رسالتك</label>
          <textarea id="message" rows="5" placeholder="اكتب استفسارك أو رسالتك هنا..."></textarea>

          <button type="button" className="contact-us-submit">إرسال الرسالة</button>
        </form>
        
      </div>
    </div>
  );
};

export default ContactUs;