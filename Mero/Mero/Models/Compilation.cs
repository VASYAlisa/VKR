namespace Mero.Models
{
    public class Compilation
    {
        public Compilation() 
        {
            Events = new HashSet<Event>();
        }
        public int Id { get; set; }
        public string Title { get; set; }
        public virtual ICollection<Event> Events { get; set; }
    }
}
