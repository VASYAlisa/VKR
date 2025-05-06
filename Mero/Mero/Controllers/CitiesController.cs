using Mero.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [EnableCors("AllowAll")]
    public class CitiesController : ControllerBase
    {
        private readonly MeroContext _context;
        private readonly ILogger<CitiesController> _logger;

        public CitiesController(MeroContext context, ILogger<CitiesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<City>>> GetCities()
        {
            return Ok(await _context.Cities.ToListAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<City>> GetCity(int id)
        {
            var city = await _context.Cities.FindAsync(id);
            if (city == null)
            {
                return NotFound(new { message = $"Город с ID {id} не найден" });
            }
            return Ok(city);
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<City>> PostCity([FromBody] City city)
        {
            _logger.LogInformation("Получен запрос на создание города: {@City}", city);

            if (city == null)
            {
                _logger.LogWarning("Тело запроса пустое");
                return BadRequest(new { message = "Тело запроса не может быть пустым" });
            }

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Некорректная модель: {@Errors}", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                return BadRequest(new { message = "Некорректные данные", errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            if (string.IsNullOrWhiteSpace(city.Title))
            {
                _logger.LogWarning("Пустое название города");
                return BadRequest(new { message = "Название города не может быть пустым" });
            }

            if (await _context.Cities.AnyAsync(c => c.Title == city.Title))
            {
                _logger.LogWarning("Город с названием {Title} уже существует", city.Title);
                return Conflict(new { message = "Город с таким названием уже существует" });
            }

            _context.Cities.Add(city);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Город успешно создан: {@City}", city);
            return CreatedAtAction(nameof(GetCity), new { id = city.Id }, city);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> PutCity(int id, [FromBody] City updatedCity)
        {
            if (id != updatedCity.Id)
            {
                return BadRequest(new { message = "ID в запросе не совпадает с ID города" });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new { message = "Некорректные данные", errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            var city = await _context.Cities.FindAsync(id);
            if (city == null)
            {
                return NotFound(new { message = $"Город с ID {id} не найден" });
            }

            if (string.IsNullOrWhiteSpace(updatedCity.Title))
            {
                return BadRequest(new { message = "Название города не может быть пустым" });
            }

            if (await _context.Cities.AnyAsync(c => c.Title == updatedCity.Title && c.Id != id))
            {
                return Conflict(new { message = "Город с таким названием уже существует" });
            }

            city.Title = updatedCity.Title;
            _context.Entry(city).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteCity(int id)
        {
            var city = await _context.Cities.FindAsync(id);
            if (city == null)
            {
                return NotFound(new { message = $"Город с ID {id} не найден" });
            }

            if (await _context.Locations.AnyAsync(l => l.CityId == id))
            {
                return BadRequest(new { message = "Нельзя удалить город, так как он связан с локациями" });
            }

            _context.Cities.Remove(city);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}