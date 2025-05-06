using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mero.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Mero.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventsController : ControllerBase
    {
        private readonly MeroContext _context;

        public EventsController(MeroContext context)
        {
            _context = context;
        }

        // GET: api/Events
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Event>>> GetEvents(
            [FromQuery] int? cityId,
            [FromQuery] int? categoryId,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            var query = _context.Events
                .Include(e => e.Location)
                    .ThenInclude(l => l.City)
                .Include(e => e.Hall)
                .Include(e => e.Categories)
                .Include(e => e.TicketTypes)
                .AsQueryable();

            if (cityId.HasValue)
                query = query.Where(e => e.Location.CityId == cityId);

            if (categoryId.HasValue)
                query = query.Where(e => e.Categories.Any(c => c.Id == categoryId));

            if (fromDate.HasValue)
                query = query.Where(e => e.Date >= fromDate);

            if (toDate.HasValue)
                query = query.Where(e => e.Date <= toDate);

            return await query.ToListAsync();
        }

        // GET: api/Events/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Event>> GetEvent(int id)
        {
            var @event = await _context.Events
                .Include(e => e.Location)
                    .ThenInclude(l => l.City)
                .Include(e => e.Hall)
                .Include(e => e.Categories)
                .Include(e => e.TicketTypes)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (@event == null)
            {
                return NotFound();
            }

            return @event;
        }

        // POST: api/Events
        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<Event>> CreateEvent(EventCreateDto eventDto)
        {
            var location = await _context.Locations.FindAsync(eventDto.LocationId);
            if (location == null)
            {
                return BadRequest("Указанная локация не существует.");
            }

            if (eventDto.HallId.HasValue)
            {
                var hall = await _context.Halls.FindAsync(eventDto.HallId);
                if (hall == null)
                {
                    return BadRequest("Указанный зал не существует.");
                }
                if (hall.LocationId != eventDto.LocationId)
                {
                    return BadRequest("Указанный зал не принадлежит выбранной локации.");
                }
            }

            var @event = new Event
            {
                Title = eventDto.Title,
                BasePrice = eventDto.BasePrice,
                Date = eventDto.Date,
                Description = eventDto.Description,
                Image = eventDto.Image,
                LocationId = eventDto.LocationId,
                HallId = eventDto.HallId,
                MaxTickets = eventDto.MaxTickets,
                Categories = new List<Category>()
            };

            if (eventDto.CategoryIds != null && eventDto.CategoryIds.Any())
            {
                var categories = await _context.Categories
                    .Where(c => eventDto.CategoryIds.Contains(c.Id))
                    .ToListAsync();

                foreach (var category in categories)
                {
                    @event.Categories.Add(category);
                }
            }

            _context.Events.Add(@event);
            await _context.SaveChangesAsync();

            var createdEvent = await _context.Events
                .Include(e => e.Location)
                    .ThenInclude(l => l.City)
                .Include(e => e.Hall)
                .Include(e => e.Categories)
                .Include(e => e.TicketTypes)
                .FirstOrDefaultAsync(e => e.Id == @event.Id);

            return CreatedAtAction(nameof(GetEvent), new { id = @event.Id }, createdEvent);
        }

        // PUT: api/Events/5
        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateEvent(int id, EventUpdateDto eventDto)
        {
            var @event = await _context.Events
                .Include(e => e.Categories)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (@event == null)
            {
                return NotFound();
            }

            var location = await _context.Locations.FindAsync(eventDto.LocationId);
            if (location == null)
            {
                return BadRequest("Указанная локация не существует.");
            }

            if (eventDto.HallId.HasValue)
            {
                var hall = await _context.Halls.FindAsync(eventDto.HallId);
                if (hall == null)
                {
                    return BadRequest("Указанный зал не существует.");
                }
                if (hall.LocationId != eventDto.LocationId)
                {
                    return BadRequest("Указанный зал не принадлежит выбранной локации.");
                }
            }

            @event.Title = eventDto.Title;
            @event.BasePrice = eventDto.BasePrice;
            @event.Date = eventDto.Date;
            @event.Description = eventDto.Description;
            @event.Image = eventDto.Image;
            @event.LocationId = eventDto.LocationId;
            @event.HallId = eventDto.HallId;
            @event.MaxTickets = eventDto.MaxTickets;

            if (eventDto.CategoryIds != null)
            {
                @event.Categories.Clear();
                var categories = await _context.Categories
                    .Where(c => eventDto.CategoryIds.Contains(c.Id))
                    .ToListAsync();

                foreach (var category in categories)
                {
                    @event.Categories.Add(category);
                }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EventExists(id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        // DELETE: api/Events/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteEvent(int id)
        {
            var @event = await _context.Events.FindAsync(id);
            if (@event == null)
            {
                return NotFound();
            }

            _context.Events.Remove(@event);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Events/5/Places
        [HttpGet("{id}/Places")]
        public async Task<ActionResult<IEnumerable<Place>>> GetEventPlaces(int id)
        {
            var @event = await _context.Events
                .Include(e => e.Hall)
                    .ThenInclude(h => h.Places)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (@event == null || @event.Hall == null)
            {
                return NotFound("Событие или зал не найдены.");
            }

            return @event.Hall.Places.ToList();
        }

        // GET: api/Events/5/TicketTypes
        [HttpGet("{id}/TicketTypes")]
        public async Task<ActionResult<IEnumerable<TicketType>>> GetEventTicketTypes(int id)
        {
            var @event = await _context.Events
                .Include(e => e.TicketTypes)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (@event == null)
            {
                return NotFound("Событие не найдено.");
            }

            return @event.TicketTypes.ToList();
        }

        private bool EventExists(int id)
        {
            return _context.Events.Any(e => e.Id == id);
        }
    }

    public class EventCreateDto
    {
        public string Title { get; set; }
        public int? BasePrice { get; set; }
        public DateTime? Date { get; set; }
        public string? Description { get; set; }
        public string? Image { get; set; }
        public int LocationId { get; set; }
        public int? HallId { get; set; }
        public int? MaxTickets { get; set; }
        public List<int>? CategoryIds { get; set; }
    }

    public class EventUpdateDto
    {
        public string Title { get; set; }
        public int? BasePrice { get; set; }
        public DateTime? Date { get; set; }
        public string? Description { get; set; }
        public string? Image { get; set; }
        public int LocationId { get; set; }
        public int? HallId { get; set; }
        public int? MaxTickets { get; set; }
        public List<int>? CategoryIds { get; set; }
    }
}