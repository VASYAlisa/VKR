using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
namespace Mero.Models
{
    public class MeroContext : IdentityDbContext<User>
    {
        public virtual DbSet<Event> Events { get; set; }
        public virtual DbSet<Category> Categories { get; set; }
        public virtual DbSet<City> Cities { get; set; }
        public virtual DbSet<Account> Accounts { get; set; }
        public virtual DbSet<AccountPaymentMethod> AccountPaymentMethods { get; set; }
        //public virtual DbSet<Compilation> Compilations { get; set; }
        public virtual DbSet<Favorites> Favorites { get; set; }
        public virtual DbSet<PromoCode> PromoCodes { get; set; }
        public virtual DbSet<Ticket> Tickets { get; set; }
        public virtual DbSet<Location> Locations { get; set; }
        public virtual DbSet<Hall> Halls { get; set; }
        public virtual DbSet<Place> Places { get; set; }
        public virtual DbSet<TicketType> TicketTypes { get; set; }
        public virtual DbSet<TicketPlace> TicketPlaces { get; set; }

        //место, добавить зал, к событию

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Настройка для Place.Price
            modelBuilder.Entity<Place>()
                .Property(p => p.Price)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Place>()
                .HasIndex(p => p.HallId);

            modelBuilder.Entity<Ticket>().HasIndex(t => t.AccountId);

            modelBuilder.Entity<Ticket>()
                .Property(t => t.OrderAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Ticket>()
                .Property(t => t.OriginalAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Ticket>()
                .Property(t => t.DiscountAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<TicketPlace>()
                .Property(tp => tp.ActualPrice)
                .HasPrecision(18, 2);

            // Настройка для TicketType.Price
            modelBuilder.Entity<TicketType>()
                .Property(tt => tt.Price)
                .HasPrecision(18, 2);

            // Связь Event : Categories (многие ко многим)
            modelBuilder.Entity<Event>()
                .HasMany(e => e.Categories)
                .WithMany(c => c.Events)
                .UsingEntity(j => j.ToTable("EventCategories"));

            // Связь Event : Location (N : 1)
            modelBuilder.Entity<Event>()
                .HasOne(e => e.Location)
                .WithMany(l => l.Events)
                .HasForeignKey(e => e.LocationId)
                .IsRequired();

            // Связь Event : Hall (N : 1, опционально)
            modelBuilder.Entity<Event>()
                .HasOne(e => e.Hall)
                .WithMany(h => h.Events)
                .HasForeignKey(e => e.HallId)
                .IsRequired(false);

            // Связь Event : TicketTypes (1 : N)
            modelBuilder.Entity<TicketType>()
                .HasOne(tt => tt.Event)
                .WithMany(e => e.TicketTypes)
                .HasForeignKey(tt => tt.EventId)
                .IsRequired();

            // Связь Ticket : TicketType (N : 1, опционально)
            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.TicketType)
                .WithMany(tt => tt.Tickets)
                .HasForeignKey(t => t.TicketTypeId)
                .IsRequired(false);

            // Связь Location : City (N : 1)
            modelBuilder.Entity<Location>()
                .HasOne(l => l.City)
                .WithMany(c => c.Locations)
                .HasForeignKey(l => l.CityId)
                .IsRequired();

            // Связь Hall : Location (N : 1)
            modelBuilder.Entity<Hall>()
                .HasOne(h => h.Location)
                .WithMany(l => l.Halls)
                .HasForeignKey(h => h.LocationId)
                .IsRequired();

            // Связь Hall : Places (1 : N)
            modelBuilder.Entity<Place>()
                .HasOne(p => p.Hall)
                .WithMany(h => h.Places)
                .HasForeignKey(p => p.HallId)
                .OnDelete(DeleteBehavior.Cascade);

            // Настройка для PromoCode.DiscountValue
            modelBuilder.Entity<PromoCode>()
                .Property(p => p.DiscountValue)
                .HasPrecision(18, 2);

            modelBuilder.Entity<PromoCode>()
                .HasOne(p => p.Event)
                .WithMany()
                .HasForeignKey(p => p.EventId)
                .OnDelete(DeleteBehavior.Restrict);

            // Связь Ticket : Event (N : 1)
            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.Event)
                .WithMany(e => e.Tickets)
                .HasForeignKey(t => t.EventId)
                .IsRequired();

            // Связь TicketPlace : Ticket и Place (многие ко многим)
            modelBuilder.Entity<TicketPlace>()
                .HasKey(tp => new { tp.TicketId, tp.PlaceId });

            modelBuilder.Entity<TicketPlace>()
                .HasOne(tp => tp.Ticket)
                .WithMany(t => t.TicketPlaces)
                .HasForeignKey(tp => tp.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TicketPlace>()
                .HasOne(tp => tp.Place)
                .WithMany(p => p.TicketPlaces)
                .HasForeignKey(tp => tp.PlaceId)
                .OnDelete(DeleteBehavior.Restrict);

            // Связь User : Account
            modelBuilder.Entity<User>()
                .HasOne(u => u.Account)
                .WithOne()
                .HasForeignKey<User>(u => u.AccountId)
                .OnDelete(DeleteBehavior.SetNull);

            // Уникальность RowNumber + SeatNumber в рамках Hall
            modelBuilder.Entity<Place>()
                .HasIndex(p => new { p.HallId, p.RowNumber, p.SeatNumber })
                .IsUnique();

            //modelBuilder.Entity<Favorites>()
            //    .HasOne(f => f.Event)
            //    .WithMany()
            //    .HasForeignKey(f => f.EventId)
            //    .OnDelete(DeleteBehavior.Cascade); // Удаление записи в Favorites при удалении Event

            modelBuilder.Entity<Favorites>()
                .HasOne(f => f.Account)
                .WithMany(a => a.Favourites)
                .HasForeignKey(f => f.AccountId)
                .OnDelete(DeleteBehavior.Cascade); // Удаление записи в Favorites при удалении Account
        }
       
        protected readonly IConfiguration Configuration;
        public MeroContext(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        protected override void OnConfiguring(DbContextOptionsBuilder options)
        {
            options.UseSqlServer(Configuration.GetConnectionString("DefaultConnection"));
        }
    }
}
