namespace Mero.Models
{
    public class PromoCode
    {
        public int Id { get; set; }
        public string Title { get; set; }

        // Тип скидки: Percentage (процент) или Fixed (фиксированная)
        public string DiscountType { get; set; }

        // Размер скидки (процент или сумма)
        public decimal DiscountValue { get; set; }

        public int? MaxUsages { get; set; } // Максимум использований
        public int UsagesCount { get; set; } = 0; // Текущее кол-во использований

        public DateTime ValidUntil { get; set; } // Срок действия
        public bool IsActive { get; set; } = true;

        // Метод для проверки валидности
        public bool IsValid()
        {
            return IsActive &&
                   ValidUntil > DateTime.Now &&
                   (MaxUsages == null || UsagesCount < MaxUsages);
        }

        public int EventId { get; set; }
        public Event Event { get; set; }

        public virtual ICollection<Ticket>? Tickets { get; set; } // Связь с билетами
    }
}
