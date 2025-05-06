using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mero.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Mero.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TicketTypesController : ControllerBase
    {
        private readonly MeroContext _context;

        public TicketTypesController(MeroContext context)
        {
            _context = context;
        }

        // GET: api/TicketTypes?eventId=5
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TicketType>>> GetTicketTypes([FromQuery] int? eventId)
        {
            var query = _context.TicketTypes.AsQueryable();

            if (eventId.HasValue)
            {
                query = query.Where(tt => tt.EventId == eventId.Value);
            }

            return await query.ToListAsync();
        }

        // GET: api/TicketTypes/5
        [HttpGet("{id}")]
        public async Task<ActionResult<TicketType>> GetTicketType(int id)
        {
            var ticketType = await _context.TicketTypes.FindAsync(id);

            if (ticketType == null)
            {
                return NotFound();
            }

            return ticketType;
        }

        // POST: api/TicketTypes
        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<TicketType>> CreateTicketType(TicketTypeCreateDto ticketTypeDto)
        {
            var @event = await _context.Events.FindAsync(ticketTypeDto.EventId);
            if (@event == null)
            {
                return BadRequest("Указанное событие не существует.");
            }

            var ticketType = new TicketType
            {
                Name = ticketTypeDto.Name,
                Price = ticketTypeDto.Price,
                MaxAvailable = ticketTypeDto.MaxAvailable,
                SoldCount = 0,
                EventId = ticketTypeDto.EventId
            };

            _context.TicketTypes.Add(ticketType);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTicketType), new { id = ticketType.Id }, ticketType);
        }

        // PUT: api/TicketTypes/5
        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateTicketType(int id, TicketTypeUpdateDto ticketTypeDto)
        {
            var ticketType = await _context.TicketTypes.FindAsync(id);
            if (ticketType == null)
            {
                return NotFound();
            }

            var @event = await _context.Events.FindAsync(ticketTypeDto.EventId);
            if (@event == null)
            {
                return BadRequest("Указанное событие не существует.");
            }

            ticketType.Name = ticketTypeDto.Name;
            ticketType.Price = ticketTypeDto.Price;
            ticketType.MaxAvailable = ticketTypeDto.MaxAvailable;
            ticketType.EventId = ticketTypeDto.EventId;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TicketTypeExists(id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        // DELETE: api/TicketTypes/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteTicketType(int id)
        {
            var ticketType = await _context.TicketTypes.FindAsync(id);
            if (ticketType == null)
            {
                return NotFound();
            }

            _context.TicketTypes.Remove(ticketType);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool TicketTypeExists(int id)
        {
            return _context.TicketTypes.Any(e => e.Id == id);
        }
    }

    public class TicketTypeCreateDto
    {
        public string Name { get; set; }
        public decimal Price { get; set; }
        public int? MaxAvailable { get; set; }
        public int EventId { get; set; }
    }

    public class TicketTypeUpdateDto
    {
        public string Name { get; set; }
        public decimal Price { get; set; }
        public int? MaxAvailable { get; set; }
        public int EventId { get; set; }
    }
}