using Mero.Models;

namespace Mero.Data
{
    public class MeroContextSeed
    {
        public static async Task SeedAsync(MeroContext context)
        {
            try
            {
                context.Database.EnsureCreated();
                if (!context.Categories.Any())
                {
                    var categories = new Category[]
                    {
                        new Category { Title="Праздник"},
                        new Category { Title="Концерт"},
                        new Category { Title="Фестиваль"},
                        new Category { Title="Музыка"}
                    };
                    foreach (Category c in categories)
                    {
                        context.Categories.Add(c);
                    }
                    await context.SaveChangesAsync();
                }


                if (!context.Cities.Any())
                {
                    var citys = new City[]
                    {
                        new City { Title="Иваново"},
                        new City { Title="Москва"},
                        new City { Title="Санкт-Петербург"},
                        new City { Title="Ярославль"}
                    };
                    foreach (City c in citys)
                    {
                        context.Cities.Add(c);
                    }
                    await context.SaveChangesAsync();
                }

            }
            catch
            {
                throw;
            }
        }
    }
}
