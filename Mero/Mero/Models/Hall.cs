namespace Mero.Models
{
    public class Hall
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Layout { get; set; } // JSON с описанием схемы зала
        public int LocationId { get; set; } // Внешний ключ на локацию
        public virtual Location Location { get; set; } // Навигационное свойство

        public virtual ICollection<Place> Places { get; set; } = new List<Place>();
        public virtual ICollection<Event>? Events { get; set; }
    }
}