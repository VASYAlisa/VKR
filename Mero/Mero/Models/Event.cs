namespace Mero.Models
{
    public class Event
    {
        public Event()
        {
            Categories = new HashSet<Category>();
        }

        public int Id { get; set; }
        public string Title { get; set; }
        public int? BasePrice { get; set; } // Используется, если локация без зала
        public DateTime? Date { get; set; }
        public string? Description { get; set; }
        public string? Image { get; set; }
        public int? MaxTickets { get; set; } // Ограничение общего количества билетов (для событий без зала)

        public int LocationId { get; set; } // Внешний ключ на локацию
        public virtual Location Location { get; set; } // Навигационное свойство

        public int? HallId { get; set; } // Внешний ключ на зал (может быть null)
        public virtual Hall? Hall { get; set; } // Навигационное свойство

        public virtual ICollection<Category> Categories { get; set; }
        public virtual ICollection<Ticket> Tickets { get; set; }
        public virtual ICollection<TicketType> TicketTypes { get; set; }
        public virtual ICollection<Favorites>? Favorites { get; set; }
    }
}