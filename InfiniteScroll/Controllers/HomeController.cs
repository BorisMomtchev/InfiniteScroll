using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace InfiniteScroll.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        public JsonResult GetScollData(int offset, int count)
        {
            var repository = new Repository();

            return Json(repository.GetScrollData().Skip(offset).Take(count), 
                JsonRequestBehavior.AllowGet);
        }
    }

    public class Repository
    {
        public IList<ScrollData> GetScrollData()
        {
            var scrollData = new List<ScrollData>();

            for (int i = 0; i < 100; i++)
                scrollData.Add(new ScrollData { SRC = "Locacation_" + i.ToString(), OFFSET = i });

            return scrollData;
        }
    }

    public class ScrollData
    {
        public string SRC { get; set; }
        public int OFFSET { get; set; }
    }
}
