from typing import Annotated

from app import crud, models, schemas
from app.core import security
from app.database import get_db
from app.dependencies.auth import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.Token)
def register(user: schemas.UserRegister, db: Session = Depends(get_db)):  # noqa: B008
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = crud.create_user(db, user=user)
    access_token = security.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=schemas.Token)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),  # noqa: B008
):
    # OAuth2PasswordRequestForm uses 'username' for the identifier (email in our case)
    user = crud.get_user_by_email(db, email=form_data.username)
    if (
        not user
        or not user.hashed_password
        or not security.verify_password(form_data.password, user.hashed_password)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(
    current_user: Annotated[models.User, Depends(get_current_user)],
):
    return current_user
