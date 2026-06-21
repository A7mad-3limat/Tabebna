import React from 'react';
import { Link } from 'react-router-dom'; 
import '../styles/DoctorCard.css';

const DoctorCard = ({ doctor }) => {
  const renderStars = (rating) => {
    const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));

    return (
      <div className="doctor-card-stars" dir="ltr">
        {Array.from({ length: 5 }).map((_, index) => {
          let fill = 0;
          if (safeRating >= index + 1) {
            fill = 100;
          } else if (safeRating > index) {
            fill = (safeRating - index) * 100;
          }

          return (
            <span key={index} className="doctor-card-star-slot">
              <span className="doctor-card-star-base">★</span>
              <span
                className="doctor-card-star-fill"
                style={{
                  width: `${fill}%`
                }}
              >
                <span className="doctor-card-star-gold">★</span>
              </span>
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="doctor-card">
      <div className="doctor-info">
        <h3>{doctor.name}</h3>
        <p className="specialty">{doctor.specialty}</p>
        <p className="location">📍 {doctor.location}</p>

        <div className="rating-section">
          <div className="doctor-card-rating-row" dir="ltr">
            {renderStars(doctor.rating || 0)}
            <strong className="doctor-card-rating-value">{Number(doctor.rating || 0).toFixed(1)}</strong>
            <span className="doctor-card-rating-count">({doctor.reviewCount || 0} تقييم)</span>
          </div>
        </div>

        <Link
          to={`/doctor-profile/${doctor.id || ''}`}
          state={{ doctorData: doctor }} 
          className="profile-link"
        >
          عرض التفاصيل
        </Link>
      </div>
    </div>
  );
};

export default DoctorCard;