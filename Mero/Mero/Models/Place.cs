using Mero.Models;

public class Place
{
    public int Id { get; set; }
    public int HallId { get; set; }
    public string RowNumber { get; set; } // Например: "A", "1", "Партер-левый"
    public int SeatNumber { get; set; } // 1, 2, 3...
    public decimal Price { get; set; }
    public string? Color { get; set; } // Цвет места (например, "#1677ff")
    public bool IsBooked { get; set; }

    public virtual Hall? Hall { get; set; }
    public virtual ICollection<TicketPlace> TicketPlaces { get; set; } = new List<TicketPlace>();
}