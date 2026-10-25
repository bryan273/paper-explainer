import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.made_previews import Made_previewsService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/made_previews", tags=["made_previews"])


# ---------- Pydantic Schemas ----------
class Made_previewsData(BaseModel):
    """Entity data schema (for create/update)"""
    arxiv_id: str
    title: str
    scene_count: int


class Made_previewsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    arxiv_id: Optional[str] = None
    title: Optional[str] = None
    scene_count: Optional[int] = None


class Made_previewsResponse(BaseModel):
    """Entity response schema"""
    id: int
    arxiv_id: str
    title: str
    scene_count: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Made_previewsListResponse(BaseModel):
    """List response schema"""
    items: List[Made_previewsResponse]
    total: int
    skip: int
    limit: int


class Made_previewsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Made_previewsData]


class Made_previewsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Made_previewsUpdateData


class Made_previewsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Made_previewsBatchUpdateItem]


class Made_previewsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Made_previewsListResponse)
async def query_made_previewss(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query made_previewss with filtering, sorting, and pagination"""
    logger.debug(f"Querying made_previewss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Made_previewsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
        )
        logger.debug(f"Found {result['total']} made_previewss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid made_previews query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying made_previewss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Made_previewsListResponse)
async def query_made_previewss_all(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query made_previewss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying made_previewss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Made_previewsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} made_previewss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid made_previews query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying made_previewss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Made_previewsResponse)
async def get_made_previews(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single made_previews by ID"""
    logger.debug(f"Fetching made_previews with id: {id}, fields={fields}")
    
    service = Made_previewsService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Made_previews with id {id} not found")
            raise HTTPException(status_code=404, detail="Made_previews not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching made_previews {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Made_previewsResponse, status_code=201)
async def create_made_previews(
    data: Made_previewsData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new made_previews"""
    logger.debug(f"Creating new made_previews with data: {data}")
    
    service = Made_previewsService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create made_previews")
        
        logger.info(f"Made_previews created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating made_previews: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating made_previews: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Made_previewsResponse], status_code=201)
async def create_made_previewss_batch(
    request: Made_previewsBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple made_previewss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} made_previewss")
    
    service = Made_previewsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} made_previewss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Made_previewsResponse])
async def update_made_previewss_batch(
    request: Made_previewsBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple made_previewss in a single request"""
    logger.debug(f"Batch updating {len(request.items)} made_previewss")
    
    service = Made_previewsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} made_previewss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Made_previewsResponse)
async def update_made_previews(
    id: int,
    data: Made_previewsUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing made_previews"""
    logger.debug(f"Updating made_previews {id} with data: {data}")

    service = Made_previewsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Made_previews with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Made_previews not found")
        
        logger.info(f"Made_previews {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating made_previews {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating made_previews {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_made_previewss_batch(
    request: Made_previewsBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple made_previewss by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} made_previewss")
    
    service = Made_previewsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} made_previewss successfully")
        return {"message": f"Successfully deleted {deleted_count} made_previewss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_made_previews(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single made_previews by ID"""
    logger.debug(f"Deleting made_previews with id: {id}")
    
    service = Made_previewsService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Made_previews with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Made_previews not found")
        
        logger.info(f"Made_previews {id} deleted successfully")
        return {"message": "Made_previews deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting made_previews {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")