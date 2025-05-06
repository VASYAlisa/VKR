using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mero.Models;

namespace Mero.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LocationsController : ControllerBase
    {
        private readonly MeroContext _context;

        public LocationsController(MeroContext context)
        {
            _context = context;
        }

        // GET: api/Locations
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Location>>> GetLocations()
        {
            return await _context.Locations
                .Include(l => l.City)
                .Include(l => l.Halls)
                .ToListAsync();
        }

        // GET: api/Locations/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Location>> GetLocation(int id)
        {
            var location = await _context.Locations
                .Include(l => l.City)
                .Include(l => l.Halls)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (location == null)
            {
                return NotFound();
            }

            return location;
        }

        // POST: api/Locations
        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<Location>> CreateLocation(LocationCreateDto locationDto)
        {
            var city = await _context.Cities.FindAsync(locationDto.CityId);
            if (city == null)
            {
                return BadRequest("Указанный город не существует.");
            }

            var location = new Location
            {
                Name = locationDto.Name,
                CityId = locationDto.CityId
            };

            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            var createdLocation = await _context.Locations
                .Include(l => l.City)
                .Include(l => l.Halls)
                .FirstOrDefaultAsync(l => l.Id == location.Id);

            return CreatedAtAction(nameof(GetLocation), new { id = location.Id }, createdLocation);
        }

        // PUT: api/Locations/5
        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateLocation(int id, LocationUpdateDto locationDto)
        {
            var location = await _context.Locations.FindAsync(id);
            if (location == null)
            {
                return NotFound();
            }

            var city = await _context.Cities.FindAsync(locationDto.CityId);
            if (city == null)
            {
                return BadRequest("Указанный город не существует.");
            }

            location.Name = locationDto.Name;
            location.CityId = locationDto.CityId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Locations/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteLocation(int id)
        {
            var location = await _context.Locations
                .Include(l => l.Halls)
                .FirstOrDefaultAsync(l => l.Id == id);
            if (location == null)
            {
                return NotFound();
            }

            if (location.Halls.Any())
            {
                return BadRequest("Нельзя удалить локацию, у которой есть залы.");
            }

            _context.Locations.Remove(location);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class LocationCreateDto
    {
        public string Name { get; set; }
        public int CityId { get; set; }
    }

    public class LocationUpdateDto
    {
        public string Name { get; set; }
        public int CityId { get; set; }
    }
}