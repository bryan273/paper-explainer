import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.feedback import FeedbackService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/feedback", tags=["feedback"])


# ---------- Pydantic Schemas ----------
class FeedbackData(BaseModel):
    """Entity data schema (for create/update)"""
    rating: int = None
    use_case: str = None
    comment: str = None
    email: str = None
    arxiv: str = None
    kind: str


class FeedbackUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    rating: Optional[int] = None
    use_case: Optional[str] = None
    comment: Optional[str] = None
    email: Optional[str] = None
    arxiv: Optional[str] = None
    kind: Optional[str] = None


class FeedbackResponse(BaseModel):
    """Entity response schema"""
    id: int
    rating: Optional[int] = None
    use_case: Optional[str] = None
    comment: Optional[str] = None
    email: Optional[str] = None
    arxiv: Optional[str] = None
    kind: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FeedbackListResponse(BaseModel):
    """List response schema"""
    items: List[FeedbackResponse]
    total: int
    skip: int
    limit: int


class FeedbackBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[FeedbackData]


class FeedbackBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: FeedbackUpdateData


class FeedbackBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[FeedbackBatchUpdateItem]


class FeedbackBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=FeedbackListResponse)
async def query_feedbacks(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query feedbacks with filtering, sorting, and pagination"""
    logger.debug(f"Querying feedbacks: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = FeedbackService(db)
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
        logger.debug(f"Found {result['total']} feedbacks")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid feedback query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying feedbacks: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=FeedbackListResponse)
async def query_feedbacks_all(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query feedbacks with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying feedbacks: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = FeedbackService(db)
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
        logger.debug(f"Found {result['total']} feedbacks")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid feedback query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying feedbacks: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=FeedbackResponse)
async def get_feedback(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single feedback by ID"""
    logger.debug(f"Fetching feedback with id: {id}, fields={fields}")
    
    service = FeedbackService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Feedback with id {id} not found")
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching feedback {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=FeedbackResponse, status_code=201)
async def create_feedback(
    data: FeedbackData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new feedback"""
    logger.debug(f"Creating new feedback with data: {data}")
    
    service = FeedbackService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create feedback")
        
        logger.info(f"Feedback created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating feedback: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating feedback: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[FeedbackResponse], status_code=201)
async def create_feedbacks_batch(
    request: FeedbackBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple feedbacks in a single request"""
    logger.debug(f"Batch creating {len(request.items)} feedbacks")
    
    service = FeedbackService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} feedbacks successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[FeedbackResponse])
async def update_feedbacks_batch(
    request: FeedbackBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple feedbacks in a single request"""
    logger.debug(f"Batch updating {len(request.items)} feedbacks")
    
    service = FeedbackService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} feedbacks successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=FeedbackResponse)
async def update_feedback(
    id: int,
    data: FeedbackUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing feedback"""
    logger.debug(f"Updating feedback {id} with data: {data}")

    service = FeedbackService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Feedback with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        logger.info(f"Feedback {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating feedback {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating feedback {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_feedbacks_batch(
    request: FeedbackBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple feedbacks by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} feedbacks")
    
    service = FeedbackService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} feedbacks successfully")
        return {"message": f"Successfully deleted {deleted_count} feedbacks", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_feedback(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single feedback by ID"""
    logger.debug(f"Deleting feedback with id: {id}")
    
    service = FeedbackService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Feedback with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        logger.info(f"Feedback {id} deleted successfully")
        return {"message": "Feedback deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting feedback {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")