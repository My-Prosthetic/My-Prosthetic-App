<?php

namespace App\Http\Controllers;

use App\Http\Requests\PatientRequest;
use App\Http\Requests\StoreShareRequest;
use App\Http\Requests\UpdateShareRequest;
use App\Http\Resources\ShareResource;
use App\Models\User;
use App\Models\UserShare;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

/**
 * A patient's management of their own Access Grants, addressed by specialist id.
 * A stored grant does not authorize any read of patient data on its own.
 */
class ShareController extends Controller
{
    public function index(PatientRequest $request): AnonymousResourceCollection
    {
        // Sorted in SQL so names follow the database collation, as in specialist search.
        $shares = $request->patient()->grantedShares()
            ->join('users as specialists', 'specialists.id', '=', 'user_shares.specialist_id')
            ->orderBy('specialists.name')
            ->orderBy('user_shares.specialist_id')
            ->select('user_shares.*')
            ->with('specialist')
            ->get();

        return ShareResource::collection($shares);
    }

    public function store(StoreShareRequest $request): JsonResponse
    {
        $patient = $request->patient();
        $specialistId = $request->specialistId();

        if ($this->findShare($patient, $specialistId) !== null) {
            $this->abortAlreadyShared();
        }

        try {
            $share = UserShare::query()->forceCreate([
                'patient_id' => $patient->id,
                'specialist_id' => $specialistId,
                'permissions' => $request->permissions(),
            ]);
        } catch (UniqueConstraintViolationException) {
            // A concurrent request created the same grant first.
            $this->abortAlreadyShared();
        }

        return ShareResource::make($share->load('specialist'))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(UpdateShareRequest $request, string $specialist): ShareResource
    {
        $share = $this->findShareOrFail($request->patient(), $specialist);

        $share->update(['permissions' => $request->permissions()]);

        return ShareResource::make($share->load('specialist'));
    }

    public function destroy(PatientRequest $request, string $specialist): Response
    {
        $this->findShareOrFail($request->patient(), $specialist)->delete();

        return response()->noContent();
    }

    private function findShare(User $patient, string $specialistId): ?UserShare
    {
        return $patient->grantedShares()
            ->where('specialist_id', Str::lower($specialistId))
            ->first();
    }

    private function abortAlreadyShared(): never
    {
        abort(Response::HTTP_CONFLICT, 'You already share data with this specialist.');
    }

    private function findShareOrFail(User $patient, string $specialistId): UserShare
    {
        $share = $this->findShare($patient, $specialistId);

        abort_if($share === null, Response::HTTP_NOT_FOUND, 'You do not share data with this specialist.');

        return $share;
    }
}
