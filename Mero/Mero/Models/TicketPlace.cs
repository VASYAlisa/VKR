namespace Mero.Models
{
    public class TicketPlace
    {
        public int TicketId { get; set; }
        public virtual Ticket Ticket { get; set; }

        public int PlaceId { get; set; }
        public virtual Place Place { get; set; }

        // Дополнительные данные, если нужно:
        public decimal? ActualPrice { get; set; } // Цена с учетом скидки
    }
}
