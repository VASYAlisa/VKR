import React, { useRef, useState, useEffect } from 'react';
import { Button, Tooltip } from 'antd';
import './SeatGrid.css';

const SeatGrid = ({ rows, mode = 'view', selectedSeats = [], onSelectSeat }) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Измеряем ширину контейнера при монтировании и изменении размера окна
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Собираем уникальные цены и их цвета для легенды
  const priceColors = {};
  rows.forEach(row => {
    row.seats.forEach(seat => {
      if (!priceColors[seat.price]) {
        priceColors[seat.price] = seat.color || '#1677ff';
      }
    });
  });

  const maxCols = Math.max(...rows.map(row => row.count), 1);

  // Динамическая ширина кнопки на основе реальной ширины контейнера
  const totalMargins = maxCols * 8; // 4px слева + 4px справа для каждой кнопки
  const availableWidth = containerWidth > 0 ? containerWidth - 100 - totalMargins : 0; // Вычитаем ширину row-label
  const seatWidth = Math.max(20, Math.min(availableWidth / maxCols, 46)); // Минимум 20px, максимум 46px
  const seatHeight = seatWidth; // Квадратные кнопки

  // Центр самого длинного ряда
  const maxRowWidth = maxCols * (seatWidth + 8); // Учитываем margin
  const maxRowCenter = maxRowWidth / 2;

  return (
    <div className="seat-grid-container" ref={containerRef}>
      {/* Легенда */}
      <div className="seat-grid-legend">
        {Object.entries(priceColors).map(([price, color]) => (
          <div key={price} className="legend-item">
            <div className="legend-color" style={{ backgroundColor: color }} />
            <span className="legend-price">{price} ₽</span>
          </div>
        ))}
      </div>

      {/* Сетка рядов и мест */}
      <div className="seat-grid">
        {rows.map(row => {
          const seats = row.seats.sort((a, b) => a.seatNumber - b.seatNumber);
          const seatCount = row.count;

          // Вычисляем центр текущего ряда
          
          let rowCenter;
          if (seatCount % 2 === 0) {
            rowCenter = (seatCount / 2) * (seatWidth + 8) - (seatWidth / 2 + 4); // Между местами
          } else {
            rowCenter = ((seatCount + 1) / 2) * (seatWidth + 8) - (seatWidth / 2 + 8); // Центр места
          }

          // Вычисляем смещение для центрирования
          const paddingLeft = maxRowCenter - rowCenter;

          return (
            <React.Fragment key={row.rowNumber}>
              {/* Подпись ряда */}
              <div className="row-label" style={{ height: `${seatHeight}px`, lineHeight: `${seatHeight}px` }}>
                Ряд {row.rowNumber}
              </div>
              {/* Места */}
              <div
                className="row-seats"
                style={{
                  width: `${maxRowWidth}px`,
                  paddingLeft: `${paddingLeft}px`,
                }}
              >
                {seats.map(seat => {
                  const isSelected =
                    mode === 'select' &&
                    selectedSeats.some(
                      s => s.rowNumber === row.rowNumber && s.seatNumber === seat.seatNumber
                    );
                  const isBooked = seat.isBooked;
                  const backgroundColor = isBooked
                    ? '#d9d9d9'
                    : isSelected
                    ? '#52c41a'
                    : seat.color || '#1677ff';

                  return (
                    <Tooltip
                      key={seat.seatNumber}
                      title={`Ряд ${row.rowNumber}, Место ${seat.seatNumber}, Цена ${seat.price} ₽`}
                    >
                      <Button
                        className={`seat-button ${mode === 'select' && !isBooked ? 'selectable' : ''} ${
                          isBooked ? 'booked' : ''
                        } ${isSelected ? 'selected' : ''}`}
                        style={{
                          backgroundColor,
                          color: '#fff',
                          width: `${seatWidth}px`,
                          height: `${seatHeight}px`,
                          fontSize: `${Math.max(12, seatWidth * 0.3)}px`,
                        }}
                        onClick={() => mode === 'select' && !isBooked && onSelectSeat(seat)}
                        disabled={mode === 'select' && isBooked}
                      >
                        {seat.seatNumber}
                      </Button>
                    </Tooltip>
                  );
                })}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default SeatGrid;