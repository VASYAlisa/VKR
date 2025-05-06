namespace Mero.Models
{
    public class Location
    {
        public int Id { get; set; }
        public string Name { get; set; } // Например, "Концертный зал им. Чайковского", "Парк Горького"
        public int CityId { get; set; } // Локация привязана к городу
        public virtual City City { get; set; }

        public virtual ICollection<Hall> Halls { get; set; } = new List<Hall>(); // Связь с залами
        public virtual ICollection<Event> Events { get; set; } = new List<Event>();
    }
}
