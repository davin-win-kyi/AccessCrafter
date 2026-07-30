from fastapi import APIRouter

from ..schemas.page_model import ModelPageRequest, PageModel
from ..services.page_modeler import model_page
from ..storage.data_store import save_page_model

router = APIRouter()


@router.post("/model-page", response_model=PageModel)
def post_model_page(request: ModelPageRequest) -> PageModel:
    page_model = model_page(request)
    save_page_model(page_model.modelId, page_model.model_dump(mode="json"))
    return page_model
