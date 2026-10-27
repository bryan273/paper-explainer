import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.studio_orders import Studio_ordersService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/studio_orders", tags=["studio_orders"])


# ---------- Pydantic Schemas ----------
class Studio_ordersData(BaseModel):
    """Entity data schema (for create/update)"""
    email: str
    arxiv: str
    language: str
    notes: str = None
    status: str = None


class Studio_ordersUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    email: Optional[str] = None
    arxiv: Optional[str] = None
    language: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class Studio_ordersResponse(BaseModel):
    """Entity response schema"""
    id: int
    email: str
    arxiv: str
    language: str
    notes: Optional[str] = None
    status: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Studio_ordersListResponse(BaseModel):
    """List response schema"""
    items: List[Studio_ordersResponse]
    total: int
    skip: int
    limit: int


class Studio_ordersBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Studio_ordersData]


class Studio_ordersBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Studio_ordersUpdateData


class Studio_ordersBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Studio_ordersBatchUpdateItem]


class Studio_ordersBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Studio_ordersListResponse)
async def query_studio_orderss(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query studio_orderss with filtering, sorting, and pagination"""
    logger.debug(f"Querying studio_orderss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Studio_ordersService(db)
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
        logger.debug(f"Found {result['total']} studio_orderss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid studio_orders query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying studio_orderss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Studio_ordersListResponse)
async def query_studio_orderss_all(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query studio_orderss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying studio_orderss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Studio_ordersService(db)
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
        logger.debug(f"Found {result['total']} studio_orderss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid studio_orders query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying studio_orderss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Studio_ordersResponse)
async def get_studio_orders(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single studio_orders by ID"""
    logger.debug(f"Fetching studio_orders with id: {id}, fields={fields}")
    
    service = Studio_ordersService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Studio_orders with id {id} not found")
            raise HTTPException(status_code=404, detail="Studio_orders not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching studio_orders {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Studio_ordersResponse, status_code=201)
async def create_studio_orders(
    data: Studio_ordersData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new studio_orders"""
    logger.debug(f"Creating new studio_orders with data: {data}")
    
    service = Studio_ordersService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create studio_orders")
        
        logger.info(f"Studio_orders created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating studio_orders: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating studio_orders: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Studio_ordersResponse], status_code=201)
async def create_studio_orderss_batch(
    request: Studio_ordersBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple studio_orderss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} studio_orderss")
    
    service = Studio_ordersService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} studio_orderss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Studio_ordersResponse])
async def update_studio_orderss_batch(
    request: Studio_ordersBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple studio_orderss in a single request"""
    logger.debug(f"Batch updating {len(request.items)} studio_orderss")
    
    service = Studio_ordersService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} studio_orderss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Studio_ordersResponse)
async def update_studio_orders(
    id: int,
    data: Studio_ordersUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing studio_orders"""
    logger.debug(f"Updating studio_orders {id} with data: {data}")

    service = Studio_ordersService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Studio_orders with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Studio_orders not found")
        
        logger.info(f"Studio_orders {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating studio_orders {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating studio_orders {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_studio_orderss_batch(
    request: Studio_ordersBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple studio_orderss by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} studio_orderss")
    
    service = Studio_ordersService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} studio_orderss successfully")
        return {"message": f"Successfully deleted {deleted_count} studio_orderss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_studio_orders(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single studio_orders by ID"""
    logger.debug(f"Deleting studio_orders with id: {id}")
    
    service = Studio_ordersService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Studio_orders with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Studio_orders not found")
        
        logger.info(f"Studio_orders {id} deleted successfully")
        return {"message": "Studio_orders deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting studio_orders {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")