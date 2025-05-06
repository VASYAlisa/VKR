import React from 'react';

const Reports = ({ user }) => {
  if (user.userRole !== 'admin') {
    return <div>Доступ запрещён. Эта страница только для администраторов.</div>;
  }

  return (
    <div>
      <h2>Отчеты</h2>
      <p>Здесь будут отчеты (в разработке).</p>
    </div>
  );
};

export default Reports;