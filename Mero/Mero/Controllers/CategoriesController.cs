using Mero.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    
    public class CategoriesController : ControllerBase
    {
        private readonly MeroContext _context;

        public CategoriesController(MeroContext context)
        {
            _context = context;
        }

        // GET: api/Categories
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
        {
            return Ok(await _context.Categories.ToListAsync());
        }

        // GET: api/Categories/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Category>> GetCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);

            if (category == null)
            {
                return NotFound(new { message = $"Категория с ID {id} не найдена" });
            }

            return Ok(category);
        }

        // POST: api/Categories
        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<Category>> PostCategory([FromBody] Category category)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (string.IsNullOrWhiteSpace(category.Title))
            {
                return BadRequest(new { message = "Название категории не может быть пустым" });
            }

            // Проверка на уникальность названия
            if (await _context.Categories.AnyAsync(c => c.Title == category.Title))
            {
                return Conflict(new { message = "Категория с таким названием уже существует" });
            }

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
        }

        // PUT: api/Categories/5
        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> PutCategory(int id, [FromBody] Category updatedCategory)
        {
            if (id != updatedCategory.Id)
            {
                return BadRequest(new { message = "ID в запросе не совпадает с ID категории" });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound(new { message = $"Категория с ID {id} не найдена" });
            }

            if (string.IsNullOrWhiteSpace(updatedCategory.Title))
            {
                return BadRequest(new { message = "Название категории не может быть пустым" });
            }

            // Проверка на уникальность названия (кроме текущей категории)
            if (await _context.Categories.AnyAsync(c => c.Title == updatedCategory.Title && c.Id != id))
            {
                return Conflict(new { message = "Категория с таким названием уже существует" });
            }

            category.Title = updatedCategory.Title;

            _context.Entry(category).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Categories/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound(new { message = $"Категория с ID {id} не найдена" });
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}