import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import '../styles/Navigation.css'; 

const Navigation = ({ onSearch }) => {
  return (
    <nav className="navigation-bar">
      <div className="logo">
        <Link to="/" className="logo-text">Tabeebna</Link>
      </div>
      
      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>الرئيسية</NavLink>
        <NavLink to="/login" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>لوحة التحكم</NavLink>
        <NavLink to="/contact" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>تواصل معنا</NavLink>
      </div>

      <div className="search-bar">
        <input 
          type="text" 
          className="search-input"
          placeholder="ابحث عن طبيب..." 
          onChange={(e) => onSearch(e.target.value)} 
        />
        <button className="search-button"> بحث </button>
      </div>
    </nav>
  );
};

export default Navigation;